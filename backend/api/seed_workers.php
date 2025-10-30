<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Ensure users table exists (it should in normal setup)
    $conn->exec("CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Default password: 'password'
    $defaultHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

    $defaults = [
        ['username' => 'tech.user1', 'name' => 'Technician 1', 'role' => 'Technician', 'email' => 'tech1@example.com'],
        ['username' => 'tech.user2', 'name' => 'Technician 2', 'role' => 'Technician', 'email' => 'tech2@example.com']
    ];

    $insert = $conn->prepare("INSERT IGNORE INTO users (username, password, role, name, email)
                               VALUES (:username, :password, :role, :name, :email)");

    foreach ($defaults as $d) {
        $insert->execute([
            ':username' => $d['username'],
            ':password' => $defaultHash,
            ':role'     => $d['role'],
            ':name'     => $d['name'],
            ':email'    => $d['email'],
        ]);
    }

    echo json_encode(['success' => true, 'message' => 'Default workers ensured']);
} catch (Exception $e) {
    error_log('seed_workers error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>


