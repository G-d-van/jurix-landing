<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Allow: POST');
  echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
  exit;
}

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true);
if (!is_array($body)) {
  $body = [];
}

$email = isset($body['email']) && is_string($body['email']) ? trim($body['email']) : '';
$phone = isset($body['phone']) && is_string($body['phone']) ? trim($body['phone']) : '';

if ($email === '' || $phone === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Email and phone are required'], JSON_UNESCAPED_UNICODE);
  exit;
}

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'config.php is missing'], JSON_UNESCAPED_UNICODE);
  exit;
}

$config = require $configPath;
$resendApiKey = isset($config['RESEND_API_KEY']) ? trim((string) $config['RESEND_API_KEY']) : '';
$from = isset($config['RESEND_FROM_EMAIL']) ? trim((string) $config['RESEND_FROM_EMAIL']) : 'noreply@mail.ooostop.ru';
$to = isset($config['LEAD_TO_EMAIL']) ? trim((string) $config['LEAD_TO_EMAIL']) : '3630013@mail.ru';

if ($resendApiKey === '') {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'RESEND_API_KEY is not configured'], JSON_UNESCAPED_UNICODE);
  exit;
}

$subject = isset($body['_subject']) && is_string($body['_subject']) ? $body['_subject'] : 'Заявка с сайта';
$service = isset($body['service']) && is_string($body['service']) ? $body['service'] : '';
$situation = isset($body['situation']) && is_string($body['situation']) ? $body['situation'] : '';

$situationHtml = htmlspecialchars($situation !== '' ? $situation : 'Не указана', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$situationHtml = nl2br($situationHtml, false);

$html =
  '<h2>' . htmlspecialchars($subject, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</h2>' .
  '<p><strong>Услуга:</strong> ' . htmlspecialchars($service !== '' ? $service : 'Не указана', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>' .
  '<p><strong>Телефон:</strong> ' . htmlspecialchars($phone, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>' .
  '<p><strong>Email:</strong> ' . htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>' .
  '<p><strong>Ситуация:</strong><br>' . $situationHtml . '</p>';

$text =
  $subject . "\n\n" .
  'Услуга: ' . ($service !== '' ? $service : 'Не указана') . "\n" .
  'Телефон: ' . $phone . "\n" .
  'Email: ' . $email . "\n" .
  'Ситуация: ' . ($situation !== '' ? $situation : 'Не указана');

$payload = json_encode([
  'from' => $from,
  'to' => [$to],
  'reply_to' => $email,
  'subject' => $subject,
  'html' => $html,
  'text' => $text,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer ' . $resendApiKey,
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_TIMEOUT => 30,
]);

$raw = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

error_log('Resend response: ' . $status . ' ' . (is_string($raw) ? $raw : ''));

if ($raw === false) {
  http_response_code(502);
  echo json_encode(['ok' => false, 'error' => 'Failed to send lead: ' . $curlError], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($status < 200 || $status >= 300) {
  $resendError = 'Failed to send email via Resend';
  $parsed = json_decode($raw, true);
  if (is_array($parsed) && isset($parsed['message']) && is_string($parsed['message']) && trim($parsed['message']) !== '') {
    $resendError = trim($parsed['message']);
  }
  http_response_code(502);
  echo json_encode(['ok' => false, 'error' => $resendError], JSON_UNESCAPED_UNICODE);
  exit;
}

$data = json_decode($raw, true);
$id = is_array($data) && isset($data['id']) ? $data['id'] : null;

http_response_code(200);
echo json_encode(['ok' => true, 'provider' => 'resend', 'id' => $id], JSON_UNESCAPED_UNICODE);
