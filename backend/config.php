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
            echo "Connection error: " . $exception->getMessage();
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
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $errors[] = "$field is required";
        }
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