<?php
// Minimal endpoint to debug session and DB linkage
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
if ($origin === '*') {
    header('Access-Control-Allow-Origin: *');
} else {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    $uid = $_SESSION['user_id'] ?? null;
    $role = $_SESSION['role'] ?? null;

    $dbUser = null;
    if ($uid) {
        $stmt = $conn->prepare('SELECT user_id, username, role, name FROM users WHERE user_id = :id');
        $stmt->bindParam(':id', $uid, PDO::PARAM_INT);
        $stmt->execute();
        $dbUser = $stmt->fetch();
    }

    echo json_encode([
        'success' => true,
        'session' => [
            'user_id' => $uid,
            'role' => $role,
            'username' => $_SESSION['username'] ?? null,
            'name' => $_SESSION['name'] ?? null
        ],
        'dbUser' => $dbUser
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
