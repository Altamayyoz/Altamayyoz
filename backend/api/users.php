<?php
// Disable error display to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set proper headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once '../config.php';

    // Temporary fix: Skip authentication for testing
    // TODO: Implement proper API authentication
    $user_id = 1; // Default to admin for testing
    $user_role = 'engineer';
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Initialization error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
} catch (Error $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Fatal error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
}

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRequest();
        break;
    case 'POST':
        handlePostRequest();
        break;
    case 'PUT':
        handlePutRequest();
        break;
    case 'DELETE':
        handleDeleteRequest();
        break;
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Invalid request method'
        ]);
}

function handleGetRequest() {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        $query = "SELECT * FROM users ORDER BY user_id";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        $users = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => $users
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error retrieving users: ' . $e->getMessage()
        ]);
    }
}

function handlePostRequest() {
    try {
        global $user_role;
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check if this is a public registration (has 'isRegistration' flag)
        $isRegistration = isset($input['isRegistration']) && $input['isRegistration'] === true;
        
        // Only engineers can create users (unless it's a public registration)
        if (!$isRegistration && $user_role !== 'engineer') {
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Engineer role required.'
            ]);
            return;
        }
        
        // Validate required fields
        $required_fields = ['name', 'username', 'email', 'password', 'role'];
        $errors = validateInput($input, $required_fields);
        
        if (!empty($errors)) {
            echo json_encode([
                'success' => false,
                'message' => 'Validation failed: ' . implode(', ', $errors)
            ]);
            return;
        }
        
        // Enforce password policy
        $policyErrors = validatePasswordPolicy($input['password'], $input['username'] ?? null);
        if (!empty($policyErrors)) {
            echo json_encode([
                'success' => false,
                'message' => 'Password policy not met: ' . implode('; ', $policyErrors)
            ]);
            return;
        }
        
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        // Check if username already exists
        $checkQuery = "SELECT user_id FROM users WHERE username = :username";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':username', $input['username']);
        $checkStmt->execute();
        
        if ($checkStmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'Username already exists'
            ]);
            return;
        }
        
        // Hash password
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (name, username, email, password, role) 
                  VALUES (:name, :username, :email, :password, :role)";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':name', $input['name']);
        $stmt->bindParam(':username', $input['username']);
        $stmt->bindParam(':email', $input['email']);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':role', $input['role']);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'User created successfully',
                'data' => ['user_id' => $conn->lastInsertId()]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create user'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error creating user: ' . $e->getMessage()
        ]);
    }
}

function handlePutRequest() {
    try {
        global $user_role;
        
        // Only engineers can update users
        if ($user_role !== 'engineer') {
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Engineer role required.'
            ]);
            return;
        }
        
        $userId = $_GET['id'] ?? null;
        if (!$userId) {
            echo json_encode([
                'success' => false,
                'message' => 'User ID required'
            ]);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        $query = "UPDATE users SET name = :name, username = :username, email = :email, role = :role 
                  WHERE user_id = :user_id";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':name', $input['name']);
        $stmt->bindParam(':username', $input['username']);
        $stmt->bindParam(':email', $input['email']);
        $stmt->bindParam(':role', $input['role']);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'User updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update user'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error updating user: ' . $e->getMessage()
        ]);
    }
}

function handleDeleteRequest() {
    try {
        global $user_role;
        
        // Only engineers can delete users
        if ($user_role !== 'engineer') {
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Engineer role required.'
            ]);
            return;
        }
        
        $userId = $_GET['id'] ?? null;
        if (!$userId) {
            echo json_encode([
                'success' => false,
                'message' => 'User ID required'
            ]);
            return;
        }
        
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        $query = "DELETE FROM users WHERE user_id = :user_id";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete user'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error deleting user: ' . $e->getMessage()
        ]);
    }
}
?>
