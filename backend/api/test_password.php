<?php
// Quick test script to verify password hash
require_once '../config.php';

$db = new Database();
$conn = $db->getConnection();

if ($conn) {
    $query = "SELECT username, password, role FROM users WHERE username = 'admin'";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $user = $stmt->fetch();
    
    if ($user) {
        echo "Admin user found:\n";
        echo "Username: " . $user['username'] . "\n";
        echo "Password hash: " . $user['password'] . "\n";
        echo "Role: " . $user['role'] . "\n\n";
        
        // Test password verification
        $testPassword = 'password';
        if (password_verify($testPassword, $user['password'])) {
            echo "✅ Password 'password' VERIFIES CORRECTLY\n";
        } else {
            echo "❌ Password 'password' DOES NOT verify\n";
            echo "Attempting to fix password...\n";
            
            // Update password
            $newHash = password_hash('password', PASSWORD_DEFAULT);
            $updateQuery = "UPDATE users SET password = :password WHERE username = 'admin'";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bindParam(':password', $newHash);
            if ($updateStmt->execute()) {
                echo "✅ Password updated successfully\n";
            } else {
                echo "❌ Failed to update password\n";
            }
        }
    } else {
        echo "❌ Admin user NOT found in database\n";
    }
} else {
    echo "❌ Database connection failed\n";
}
?>

