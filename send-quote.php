<?php
/**
 * send-quote.php
 *
 * Handles the "Request a quote" form on contact.html. On a valid submission
 * it emails the request to the sales inbox and sends an acknowledgement
 * receipt back to the person who submitted it.
 *
 * Requirements: a PHP host with mail() wired to a working mail transport
 * (sendmail locally configured, or an SMTP relay). Plain mail() does not
 * guarantee delivery — if messages aren't arriving reliably in production,
 * swap the two send*() calls below for an SMTP library (e.g. PHPMailer)
 * configured with your host's SMTP credentials.
 */

header('Content-Type: application/json; charset=utf-8');

// ---------- Config -------------------------------------------------------
define('SALES_EMAIL', 'Sales@brightcurrentsolutions.com');
define('SITE_NAME', 'BrightCurrent Solutions');
// This should be an address on your own sending domain — many mail
// providers flag or reject mail claiming to be "From" an address (like a
// customer's Gmail) that didn't actually originate from that provider.
define('FROM_EMAIL', 'no-reply@brightcurrentsolutions.com');
define('FROM_NAME', 'BrightCurrent Solutions Website');

// ---------- Helpers --------------------------------------------------------
function respond(bool $ok, string $message, int $status = 200): void {
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message]);
    exit;
}

function clean(string $value): string {
    return trim(strip_tags($value));
}

// Strips line breaks so submitted values can't inject extra mail headers.
function headerSafe(string $value): string {
    return preg_replace('/[\r\n]+/', ' ', $value);
}

// ---------- Method guard ---------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method.', 405);
}

// ---------- Honeypot (spam trap) -------------------------------------------
// Real visitors never see or fill this field (it's positioned off-screen);
// most bots fill in every field they find. Pretend success and drop it.
if (!empty($_POST['website'])) {
    respond(true, "Thanks — your request has been sent. We'll be in touch within one business day.");
}

// ---------- Collect + validate ----------------------------------------------
$name     = clean($_POST['name'] ?? '');
$phone    = clean($_POST['phone'] ?? '');
$email    = trim($_POST['email'] ?? '');
$service  = clean($_POST['service'] ?? '');
$siteType = clean($_POST['site-type'] ?? '');
$message  = clean($_POST['message'] ?? '');

$errors = [];
if ($name === '') $errors[] = 'Name is required.';
if ($phone === '') $errors[] = 'Phone is required.';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email is required.';
if ($service === '') $errors[] = 'Please select a service.';

if (!empty($errors)) {
    respond(false, implode(' ', $errors), 422);
}

$name  = headerSafe($name);
$email = headerSafe($email);

// ---------- Notify the sales team -------------------------------------------
$subject = "New quote request — $name";
$body = "A new quote request was submitted on the website.\n\n"
      . "Name: $name\n"
      . "Phone: $phone\n"
      . "Email: $email\n"
      . "Service needed: $service\n"
      . "Site type: $siteType\n"
      . "Message:\n$message\n";

$headers = [
    'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=utf-8',
];

$sentToSales = mail(SALES_EMAIL, $subject, $body, implode("\r\n", $headers));

if (!$sentToSales) {
    respond(false, 'Sorry — something went wrong sending your request. Please call or WhatsApp us instead.', 500);
}

// ---------- Send the customer their acknowledgement receipt -----------------
$ackSubject = "We've received your quote request — " . SITE_NAME;
$ackBody = "Hi $name,\n\n"
         . "Thanks for reaching out to " . SITE_NAME . ". We've received your request for \"$service\" "
         . "and one of our team will be in touch within one business day.\n\n"
         . "Here's a copy of what you sent us:\n"
         . "Service needed: $service\n"
         . "Site type: $siteType\n"
         . "Message: " . ($message !== '' ? $message : '(none provided)') . "\n\n"
         . "If anything above isn't right, just reply to this email.\n\n"
         . "— " . SITE_NAME . "\n"
         . "+254 748 891 464 · " . SALES_EMAIL;

$ackHeaders = [
    'From: ' . SITE_NAME . ' <' . SALES_EMAIL . '>',
    'Content-Type: text/plain; charset=utf-8',
];

// The acknowledgement email is a courtesy — if it fails to send, the request
// itself has already reached sales, so we still report success to the user.
mail($email, $ackSubject, $ackBody, implode("\r\n", $ackHeaders));

respond(true, "Thanks $name — your request has been sent. We'll be in touch within one business day, and a confirmation email is on its way to you.");
