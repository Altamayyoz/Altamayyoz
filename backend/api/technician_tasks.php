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

    // Check if user is logged in
    if (!$user_id) {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required. Please log in.'
        ]);
        exit;
    }

    // Only technicians can access this API
    if ($user_role !== 'technician') {
        echo json_encode([
            'success' => false,
            'message' => 'Access denied. Technician role required.'
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
    global $user_id;
    
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        // Get technician_id from user_id
        $tech_query = "SELECT technician_id FROM technicians WHERE user_id = :user_id";
        $tech_stmt = $conn->prepare($tech_query);
        $tech_stmt->bindParam(':user_id', $user_id);
        $tech_stmt->execute();
        $technician = $tech_stmt->fetch();
        
        if (!$technician) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'assigned_tasks' => [],
                    'daily_logs' => []
                ]
            ]);
            return;
        }
        
        $technician_id = $technician['technician_id'];
        
        // Get assigned tasks (pending and in_progress)
        $tasks_query = "SELECT t.*, jo.job_order_id, o.standard_time_minutes
                        FROM tasks t
                        LEFT JOIN job_orders jo ON t.job_order_id = jo.job_order_id
                        LEFT JOIN operations o ON t.operation_name = o.operation_name
                        WHERE t.technician_id = :technician_id
                        AND t.status IN ('pending', 'in_progress')
                        ORDER BY t.created_at DESC";
        
        $tasks_stmt = $conn->prepare($tasks_query);
        $tasks_stmt->bindParam(':technician_id', $technician_id);
        $tasks_stmt->execute();
        $assigned_tasks = $tasks_stmt->fetchAll();
        
        // Get daily logs (submitted tasks)
        $logs_query = "SELECT t.*, jo.job_order_id
                       FROM tasks t
                       LEFT JOIN job_orders jo ON t.job_order_id = jo.job_order_id
                       WHERE t.technician_id = :technician_id
                       AND t.status IN ('pending', 'approved', 'rejected')
                       ORDER BY t.created_at DESC
                       LIMIT 30";
        
        $logs_stmt = $conn->prepare($logs_query);
        $logs_stmt->bindParam(':technician_id', $technician_id);
        $logs_stmt->execute();
        $daily_logs = $logs_stmt->fetchAll();
        
        // Get device serial numbers for each log
        foreach ($daily_logs as &$log) {
            $serial_query = "SELECT serial_number FROM device_serial_numbers WHERE task_id = :task_id";
            $serial_stmt = $conn->prepare($serial_query);
            $serial_stmt->bindParam(':task_id', $log['task_id']);
            $serial_stmt->execute();
            $log['serial_numbers'] = $serial_stmt->fetchAll(PDO::FETCH_COLUMN);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Technician tasks retrieved successfully',
            'data' => [
                'assigned_tasks' => $assigned_tasks,
                'daily_logs' => $daily_logs
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error in handleGetRequest: ' . $e->getMessage()
        ]);
    }
}

function handlePostRequest() {
    global $user_id;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            sendResponse(false, 'Invalid JSON input');
        }
        
        $db = new Database();
        $conn = $db->getConnection();
        
        // Get technician_id from user_id
        $tech_query = "SELECT technician_id FROM technicians WHERE user_id = :user_id";
        $tech_stmt = $conn->prepare($tech_query);
        $tech_stmt->bindParam(':user_id', $user_id);
        $tech_stmt->execute();
        $technician = $tech_stmt->fetch();
        
        if (!$technician) {
            sendResponse(false, 'Technician record not found');
        }
        
        $technician_id = $technician['technician_id'];
        
        // Validate required fields
        $required_fields = ['operation_name', 'devices_completed', 'actual_time_minutes', 'job_order_id'];
        $errors = validateInput($input, $required_fields);
        
        if (!empty($errors)) {
            sendResponse(false, 'Validation failed: ' . implode(', ', $errors));
        }
        
        // Get standard time for operation
        $standard_query = "SELECT standard_time_minutes FROM operations WHERE operation_name = :operation_name";
        $standard_stmt = $conn->prepare($standard_query);
        $standard_stmt->bindParam(':operation_name', $input['operation_name']);
        $standard_stmt->execute();
        $operation = $standard_stmt->fetch();
        $standard_time = $operation ? $operation['standard_time_minutes'] : 30;
        
        // Calculate efficiency
        $efficiency = ($standard_time / $input['actual_time_minutes']) * 100;
        
        // Insert task
        $query = "INSERT INTO tasks (technician_id, job_order_id, date, operation_name, devices_completed,
                  actual_time_minutes, standard_time_minutes, efficiency_percentage, notes, status, created_at)
                  VALUES (:technician_id, :job_order_id, CURDATE(), :operation_name, :devices_completed,
                  :actual_time_minutes, :standard_time_minutes, :efficiency_percentage, :notes, 'pending', NOW())";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':technician_id', $technician_id);
        $stmt->bindParam(':job_order_id', $input['job_order_id']);
        $stmt->bindParam(':operation_name', $input['operation_name']);
        $stmt->bindParam(':devices_completed', $input['devices_completed']);
        $stmt->bindParam(':actual_time_minutes', $input['actual_time_minutes']);
        $stmt->bindParam(':standard_time_minutes', $standard_time);
        $stmt->bindParam(':efficiency_percentage', $efficiency);
        
        $notes = $input['notes'] ?? '';
        $stmt->bindParam(':notes', $notes);
        
        if ($stmt->execute()) {
            $task_id = $conn->lastInsertId();
            
            // Insert device serial numbers
            if (isset($input['serial_numbers']) && is_array($input['serial_numbers'])) {
                $serial_query = "INSERT INTO device_serial_numbers (task_id, serial_number, completion_date, completion_time)
                                 VALUES (:task_id, :serial_number, CURDATE(), NOW())";
                $serial_stmt = $conn->prepare($serial_query);
                
                foreach ($input['serial_numbers'] as $serial) {
                    if (!empty(trim($serial))) {
                        $serial_stmt->bindParam(':task_id', $task_id);
                        $serial_stmt->bindParam(':serial_number', $serial);
                        $serial_stmt->execute();
                    }
                }
            }
            
            // Log activity
            logActivity($user_id, 'task_submitted', "Task ID: $task_id submitted for approval");
            
            sendResponse(true, 'Task submitted successfully', [
                'task_id' => $task_id,
                'efficiency_percentage' => $efficiency
            ]);
        } else {
            sendResponse(false, 'Failed to submit task');
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
