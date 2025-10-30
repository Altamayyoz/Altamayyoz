<?php
// Database configuration
class Database {
    private $host = 'localhost';
    private $db_name = 'technician_management';
    private $username = 'root';
    private $password = '';
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                )
            );
        } catch(PDOException $exception) {
            error_log("Database connection error: " . $exception->getMessage());
        }
        
        return $this->conn;
    }
}

// Response helper
function sendResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Input validation helper
function validateInput($data, $required_fields) {
    $errors = [];
    
    foreach ($required_fields as $field) {
        if (!isset($data[$field])) {
            $errors[] = "$field is required";
        } elseif (is_string($data[$field])) {
            // Only trim strings, check if empty after trimming
            if (trim($data[$field]) === '') {
                $errors[] = "$field is required";
            }
        } elseif ($data[$field] === null || $data[$field] === '') {
            // For non-string types (numbers, etc.), check if null or empty string
            $errors[] = "$field is required";
        }
    }
    
    return $errors;
}

// Password policy validator
function validatePasswordPolicy($password, $username = null) {
    $errors = [];
    if (!is_string($password)) {
        $errors[] = 'Password must be a string';
        return $errors;
    }
    $length = strlen($password);
    if ($length < 8) {
        $errors[] = 'Password must be at least 8 characters long';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Password must contain at least one uppercase letter';
    }
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Password must contain at least one lowercase letter';
    }
    if (!preg_match('/\d/', $password)) {
        $errors[] = 'Password must contain at least one number';
    }
    if (!preg_match('/[^A-Za-z0-9]/', $password)) {
        $errors[] = 'Password must contain at least one special character';
    }
    $common = ['password','123456','12345678','qwerty','admin','letmein'];
    foreach ($common as $bad) {
        if (stripos($password, $bad) !== false) {
            $errors[] = 'Password is too common';
            break;
        }
    }
    if ($username && stripos($password, (string)$username) !== false) {
        $errors[] = 'Password must not include your username';
    }
    return $errors;
}

// Sanitize input
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Check if user is authenticated
function checkAuth() {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        sendResponse(false, 'Authentication required');
    }
    return $_SESSION['user_id'];
}

// Get user role
function getUserRole() {
    session_start();
    return $_SESSION['role'] ?? null;
}

// Log activity
function logActivity($user_id, $action, $details = '') {
    $db = new Database();
    $conn = $db->getConnection();
    
    $query = "INSERT INTO activity_log (user_id, action, details, created_at) VALUES (:user_id, :action, :details, NOW())";
    $stmt = $conn->prepare($query);
    
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':action', $action);
    $stmt->bindParam(':details', $details);
    
    try {
        $stmt->execute();
    } catch (PDOException $e) {
        // Log error but don't break the main functionality
        error_log("Activity log error: " . $e->getMessage());
    }
}
?>