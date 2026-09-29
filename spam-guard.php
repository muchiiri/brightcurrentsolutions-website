<?php
/**
 * spam-guard.php
 *
 * Shared anti-spam helpers for the contact form:
 *  - a stateless signed token proving the request came from a real page
 *    load (token.php), not a script POSTing straight to send-quote.php
 *  - a simple per-IP rate limit, backed by a small file per IP in the
 *    system temp dir (no database, nothing to provision).
 *
 * IMPORTANT: change SPAM_GUARD_SECRET to your own long random string
 * before deploying — anyone who knows this value can forge valid tokens.
 */

define('SPAM_GUARD_SECRET', 'CHANGE-ME-' . '1wXKc86mGFDngFjU2YFFCGGH6PerSSHe');

// A token must be at least this old (real users take a few seconds to fill
// the form; a bot that automates "fetch token, then immediately submit"
// gets caught here) but no older than this (stale/replayed tokens).
define('SPAM_GUARD_MIN_AGE', 3);       // seconds
define('SPAM_GUARD_MAX_AGE', 7200);    // seconds (2 hours)

// Per-IP limits once a request does carry a valid token.
define('SPAM_GUARD_MIN_INTERVAL', 20); // seconds between submissions from the same IP
define('SPAM_GUARD_MAX_PER_HOUR', 6);  // max submissions per IP per rolling hour

function spam_guard_sign(int $ts): string {
    return hash_hmac('sha256', (string) $ts, SPAM_GUARD_SECRET);
}

function spam_guard_verify_token($ts, $token): bool {
    if (!is_string($token) || $token === '' || (!is_string($ts) && !is_int($ts))) return false;
    if (!ctype_digit((string) $ts)) return false;
    $ts = (int) $ts;
    $age = time() - $ts;
    if ($age < SPAM_GUARD_MIN_AGE || $age > SPAM_GUARD_MAX_AGE) return false;
    return hash_equals(spam_guard_sign($ts), $token);
}

function spam_guard_client_ip(): string {
    // Deliberately REMOTE_ADDR only — X-Forwarded-For / X-Real-IP can be
    // spoofed by the client unless you know your host/CDN sets them safely.
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

// Returns true if this IP should be blocked right now. Fails open (returns
// false) on any filesystem problem so a hosting hiccup never blocks a real
// customer's request.
function spam_guard_rate_limited(string $ip): bool {
    $dir = sys_get_temp_dir() . '/bcs-quote-throttle';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);

    $file = $dir . '/' . hash('sha256', $ip) . '.json';
    $fp = @fopen($file, 'c+');
    if (!$fp) return false;

    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $hits = json_decode($raw, true);
    if (!is_array($hits)) $hits = [];

    $now = time();
    $hits = array_values(array_filter($hits, function ($t) use ($now) {
        return is_int($t) && ($now - $t) < 3600;
    }));

    $blocked = false;
    if (!empty($hits) && ($now - end($hits)) < SPAM_GUARD_MIN_INTERVAL) {
        $blocked = true;
    }
    if (count($hits) >= SPAM_GUARD_MAX_PER_HOUR) {
        $blocked = true;
    }

    if (!$blocked) {
        $hits[] = $now;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($hits));
    }

    flock($fp, LOCK_UN);
    fclose($fp);
    return $blocked;
}
