<?php
// Script to create admin user
require_once '../config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        die(json_encode(['success' => false, 'message' => 'Database connection failed']));
    }
    
    // Check if admin already exists
    $checkQuery = "SELECT user_id FROM users WHERE username = 'admin'";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->execute();
    
    if ($checkStmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Admin user already exists'
        ]);
        exit;
    }
    
    // Create admin user
    $username = 'admin';
    $password = 'password'; // Default password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $name = 'System Administrator';
    $email = 'admin@company.com';
    $role = 'engineer'; // Maps to Admin role in frontend
    
    $query = "INSERT INTO users (username, password, role, name, email) 
              VALUES (:username, :password, :role, :name, :email)";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':password', $hashedPassword);
    $stmt->bindParam(':role', $role);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':email', $email);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Admin user created successfully',
            'credentials' => [
                'username' => $username,
                'password' => $password,
                'note' => 'Please change the password after first login'
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create admin user'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>

