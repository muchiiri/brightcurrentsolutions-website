<?php
/**
 * token.php
 *
 * Issues a short-lived, stateless anti-spam token for the contact form.
 * The contact page fetches this once it actually loads in a browser; a
 * script POSTing straight to send-quote.php without ever calling this
 * endpoint has no valid token and is rejected there. See spam-guard.php.
 */

header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/spam-guard.php';

$ts = time();
echo json_encode(['ts' => $ts, 'token' => spam_guard_sign($ts)]);
