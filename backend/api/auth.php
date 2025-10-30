<?php
// Set CORS headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

// Handle authentication requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['action']) && $input['action'] === 'logout') {
        session_start();
        session_destroy();
        sendResponse(true, 'Logged out successfully');
    }
    
    // Handle forgot password request
    if (isset($input['action']) && $input['action'] === 'forgot_password') {
        $username = sanitizeInput($input['username'] ?? '');
        $newPassword = $input['new_password'] ?? '';
        
        if (empty($username) || empty($newPassword)) {
            sendResponse(false, 'Username and new password are required');
        }
        
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            sendResponse(false, 'Database connection failed');
        }
        
        // Check if user exists
        $query = "SELECT user_id FROM users WHERE username = :username";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        $user = $stmt->fetch();
        
        if (!$user) {
            sendResponse(false, 'User not found');
        }
        
        // Update password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateQuery = "UPDATE users SET password = :password WHERE username = :username";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bindParam(':password', $hashedPassword);
        $updateStmt->bindParam(':username', $username);
        
        if ($updateStmt->execute()) {
            logActivity($user['user_id'], 'password_reset', 'Password reset via forgot password');
            sendResponse(true, 'Password reset successfully');
        } else {
            sendResponse(false, 'Failed to update password');
        }
        exit;
    }
    
    // Login process - support both username and email
    $username = sanitizeInput($input['username'] ?? $input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    // Debug logging
    error_log("Login attempt - Username: '$username', Password: '$password'");
    error_log("Input array: " . print_r($input, true));
    
    // Validate input - check for either username or email
    $errors = [];
    if (empty($username)) {
        $errors[] = 'username or email is required';
    }
    if (empty($password)) {
        $errors[] = 'password is required';
    }
    if (!empty($errors)) {
        sendResponse(false, 'Validation failed: ' . implode(', ', $errors));
    }
    
    // Connect to database
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        sendResponse(false, 'Database connection failed');
    }
    
    // Query user by username only (role comes from database)
    $query = "SELECT u.*, t.station_assigned FROM users u 
              LEFT JOIN technicians t ON u.user_id = t.user_id 
              WHERE u.username = :username";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':username', $username);
    $stmt->execute();
    
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        // Start session
        session_start();
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['station'] = $user['station_assigned'] ?? null;
        
        // Log activity
        logActivity($user['user_id'], 'login', 'User logged in');
        
        sendResponse(true, 'Login successful', [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'name' => $user['name'],
            'station' => $user['station_assigned'] ?? null
        ]);
    } else {
        sendResponse(false, 'Invalid credentials');
    }
}

// Handle GET requests (check session)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    session_start();
    
    if (isset($_SESSION['user_id'])) {
        sendResponse(true, 'User authenticated', [
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role'],
            'name' => $_SESSION['name'],
            'station' => $_SESSION['station'] ?? null
        ]);
    } else {
        // Return 200 with error message instead of 401 to avoid browser auth popup
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        exit;
    }
}

sendResponse(false, 'Invalid request method');
?>