<?php
// Test login credentials
require_once '../config.php';

$username = 'admin';
$password = 'password';

$db = new Database();
$conn = $db->getConnection();

$query = "SELECT user_id, username, password, role, name FROM users WHERE username = :username";
$stmt = $conn->prepare($query);
$stmt->bindParam(':username', $username);
$stmt->execute();

$user = $stmt->fetch();

if ($user) {
    echo "User found:\n";
    echo "Username: " . $user['username'] . "\n";
    echo "Password hash: " . $user['password'] . "\n";
    echo "Role: " . $user['role'] . "\n";
    echo "Name: " . $user['name'] . "\n";
    
    // Test password verification
    if (password_verify($password, $user['password'])) {
        echo "\nPassword verification: SUCCESS ✓\n";
    } else {
        echo "\nPassword verification: FAILED ✗\n";
        echo "Trying to update password...\n";
        
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $updateQuery = "UPDATE users SET password = :password WHERE username = :username";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bindParam(':password', $newHash);
        $updateStmt->bindParam(':username', $username);
        
        if ($updateStmt->execute()) {
            echo "Password updated successfully!\n";
            
            // Verify again
            if (password_verify($password, $newHash)) {
                echo "New password verification: SUCCESS ✓\n";
            }
        }
    }
} else {
    echo "User not found!\n";
}
?>


