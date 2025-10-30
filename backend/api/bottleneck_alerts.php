<?php
require_once '../config.php';
require_once '../cors.php';

// Define sendResponse function first
function sendResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

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
    case 'GET':
        handleGetRequest();
        break;
    case 'POST':
        handlePostRequest();
        break;
    default:
        sendResponse(false, 'Invalid request method');
}

function handleGetRequest() {
    global $conn;
    
    // Get bottleneck alerts sent to admin
    $query = "SELECT 
                ba.*, 
                u.username as sender_name,
                u.email as sender_email,
                DATE_FORMAT(ba.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date
              FROM bottleneck_alerts ba
              JOIN users u ON ba.sent_by = u.user_id
              ORDER BY ba.created_at DESC
              LIMIT 50";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $alerts = $stmt->fetchAll();
    
    sendResponse(true, 'Bottleneck alerts retrieved successfully', $alerts);
}

function handlePostRequest() {
    global $conn, $user_id;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['bottleneck_tasks']) || !is_array($input['bottleneck_tasks'])) {
        sendResponse(false, 'Bottleneck tasks array is required');
    }
    
    $bottleneckTasks = $input['bottleneck_tasks'];
    $message = $input['message'] ?? '';
    
    if (empty($bottleneckTasks)) {
        sendResponse(false, 'No bottleneck tasks to send');
    }
    
    // Format the bottleneck tasks for the message
    $tasksList = implode(', ', $bottleneckTasks);
    $alertMessage = !empty($message) 
        ? "Planning Engineer Alert: $message\n\nBottleneck Tasks: $tasksList"
        : "Bottleneck Tasks identified requiring attention: $tasksList";
    
    try {
        // Insert into alerts table for admin
        $query = "INSERT INTO alerts (technician_id, alert_type, message, severity, date, read_status, created_at) 
                  VALUES (NULL, 'warning', :message, 'warning', CURDATE(), FALSE, NOW())";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':message', $alertMessage);
        $stmt->execute();
        
        // Also store in bottleneck_alerts table for tracking (if it exists)
        // Check if table exists first
        $checkTable = "SHOW TABLES LIKE 'bottleneck_alerts'";
        $checkStmt = $conn->prepare($checkTable);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            $query = "INSERT INTO bottleneck_alerts (sent_by, bottleneck_tasks, message, created_at) 
                      VALUES (:user_id, :tasks, :message, NOW())";
            $stmt = $conn->prepare($query);
            $tasksJson = json_encode($bottleneckTasks);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':tasks', $tasksJson);
            $stmt->bindParam(':message', $message);
            $stmt->execute();
        }
        
        // Log the activity
        if (function_exists('logActivity')) {
            logActivity($user_id, 'send_bottleneck_alert', "Sent bottleneck alert with " . count($bottleneckTasks) . " tasks to admin");
        }
        
        sendResponse(true, 'Bottleneck alert sent to admin successfully');
        
    } catch (PDOException $e) {
        error_log("Bottleneck alert error: " . $e->getMessage());
        sendResponse(false, 'Failed to send bottleneck alert: ' . $e->getMessage());
    }
}

?>

