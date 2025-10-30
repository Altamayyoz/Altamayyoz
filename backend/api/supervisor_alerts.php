<?php
// Supervisor Alerts API - Send alerts to Planning Engineer
require_once '../config.php';
require_once '../cors.php';

header('Content-Type: application/json');

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    sendResponse(false, 'Database connection failed');
}

session_start();

if (!isset($_SESSION['user_id'])) {
    sendResponse(false, 'Authentication required');
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handlePostRequest();
        break;
    case 'GET':
        handleGetRequest();
        break;
    default:
        sendResponse(false, 'Invalid request method');
}

function handlePostRequest() {
    global $conn, $user_id;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['alert_type']) || !isset($input['message'])) {
        sendResponse(false, 'alert_type and message are required');
    }
    
    $alertType = $input['alert_type'];
    $message = $input['message'];
    $severity = $input['severity'] ?? 'warning';
    $jobOrderId = $input['job_order_id'] ?? null;
    
    // Get user name for the alert message
    $userQuery = "SELECT name FROM users WHERE user_id = :user_id";
    $userStmt = $conn->prepare($userQuery);
    $userStmt->bindParam(':user_id', $user_id);
    $userStmt->execute();
    $user = $userStmt->fetch();
    $userName = $user ? $user['name'] : 'Supervisor';
    
    // Format message to include sender info and job order if applicable
    $alertMessage = "Supervisor Alert from {$userName}: {$message}";
    if ($jobOrderId) {
        $alertMessage .= " (Job Order: {$jobOrderId})";
    }
    
    try {
        // Insert into alerts table (for Planning Engineer to see)
        $query = "INSERT INTO alerts (technician_id, alert_type, message, severity, date, read_status, created_at) 
                  VALUES (NULL, :alert_type, :message, :severity, CURDATE(), FALSE, NOW())";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':alert_type', $alertType);
        $stmt->bindParam(':message', $alertMessage);
        $stmt->bindParam(':severity', $severity);
        $stmt->execute();
        
        // Log the activity
        if (function_exists('logActivity')) {
            logActivity($user_id, 'send_alert', "Sent alert to Planning Engineer: {$alertType}");
        }
        
        sendResponse(true, 'Alert sent to Planning Engineer successfully');
        
    } catch (PDOException $e) {
        error_log("Supervisor alert error: " . $e->getMessage());
        sendResponse(false, 'Failed to send alert: ' . $e->getMessage());
    }
}

function handleGetRequest() {
    global $conn;
    
    // Get alerts for supervisor (from technicians)
    $query = "SELECT 
                a.*, 
                u.name as technician_name
              FROM alerts a
              LEFT JOIN technicians t ON a.technician_id = t.technician_id
              LEFT JOIN users u ON t.user_id = u.user_id
              WHERE a.read_status = FALSE
              ORDER BY a.created_at DESC
              LIMIT 50";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $alerts = $stmt->fetchAll();
    
    sendResponse(true, 'Alerts retrieved successfully', $alerts);
}

function sendResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

?>


