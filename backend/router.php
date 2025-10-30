<?php
// Router script for PHP built-in server
// This prevents the server from sending WWW-Authenticate headers

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Serve static files directly
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

// Remove any WWW-Authenticate headers
header_remove('WWW-Authenticate');

// Route API requests
if (preg_match('/^\/api\/(.+)\.php$/', $uri, $matches)) {
    $file = __DIR__ . '/api/' . $matches[1] . '.php';
    if (file_exists($file)) {
        require $file;
        exit;
    }
}

// Route other PHP files
if (preg_match('/^\/(.+)\.php$/', $uri, $matches)) {
    $file = __DIR__ . '/' . $matches[1] . '.php';
    if (file_exists($file)) {
        require $file;
        exit;
    }
}

// 404 for everything else
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'Not found']);
?>

