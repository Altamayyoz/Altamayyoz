<?php
// Disable error display to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start session FIRST before any headers or output
session_start();

// Set proper headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once '../config.php';

    // Get user information from session
    $user_id = $_SESSION['user_id'] ?? null;
    $user_role = $_SESSION['role'] ?? null;

    // Only supervisors can assign tasks
    if ($user_role !== 'supervisor') {
        echo json_encode([
            'success' => false,
            'message' => 'Access denied. Supervisor role required.'
        ]);
        exit;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Initialization error: ' . $e->getMessage()
    ]);
    exit;
}

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        handlePostRequest();
        break;
    default:
        sendResponse(false, 'Invalid request method');
}

function handlePostRequest() {
    global $user_id;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            sendResponse(false, 'Invalid JSON input');
        }
        
        // Validate required fields
        $required_fields = ['technician_id', 'job_order_id', 'operation_name'];
        $errors = validateInput($input, $required_fields);
        
        if (!empty($errors)) {
            sendResponse(false, 'Validation failed: ' . implode(', ', $errors));
        }
        
        $db = new Database();
        $conn = $db->getConnection();
        
        // Get standard time for operation
        $standard_query = "SELECT standard_time_minutes FROM operations WHERE operation_name = :operation_name";
        $standard_stmt = $conn->prepare($standard_query);
        $standard_stmt->bindParam(':operation_name', $input['operation_name']);
        $standard_stmt->execute();
        $operation = $standard_stmt->fetch();
        $standard_time = $operation ? $operation['standard_time_minutes'] : 30;
        
        // Insert task with 'pending' status (technician hasn't started yet)
        $query = "INSERT INTO tasks (technician_id, job_order_id, date, operation_name, devices_completed,
                  actual_time_minutes, standard_time_minutes, efficiency_percentage, notes, status, created_at)
                  VALUES (:technician_id, :job_order_id, CURDATE(), :operation_name, 0,
                  0, :standard_time_minutes, 0, '', 'pending', NOW())";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':technician_id', $input['technician_id']);
        $stmt->bindParam(':job_order_id', $input['job_order_id']);
        $stmt->bindParam(':operation_name', $input['operation_name']);
        $stmt->bindParam(':standard_time_minutes', $standard_time);
        
        if ($stmt->execute()) {
            $task_id = $conn->lastInsertId();
            
            // Log activity
            logActivity($user_id, 'task_assigned', "Task ID: $task_id assigned to technician ID: {$input['technician_id']}");
            
            sendResponse(true, 'Task assigned successfully', [
                'task_id' => $task_id
            ]);
        } else {
            sendResponse(false, 'Failed to assign task');
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error in handlePostRequest: ' . $e->getMessage()
        ]);
    }
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


