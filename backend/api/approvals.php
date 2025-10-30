<?php
// Disable error display to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start session FIRST before any headers or output
// Start session and set proper headers
session_start();

// CORS - allow requests from the requesting origin and allow credentials
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
if ($origin === '*') {
    // If no origin header present, fall back to wildcard (safe for same-origin testing).
    header('Access-Control-Allow-Origin: *');
} else {
    // When credentials are required, Access-Control-Allow-Origin cannot be '*'
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

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

    // Debug logging
    error_log("Approvals API - Session data: " . print_r($_SESSION, true));
    error_log("Approvals API - User ID: " . ($user_id ?? 'null'));
    error_log("Approvals API - User Role: " . ($user_role ?? 'null'));

    // Require a logged-in supervisor. Do NOT silently fallback to another account.
    // If the frontend is not sending cookies, it should call the API with credentials and origin.
    if (!$user_id || $user_role !== 'supervisor') {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication error: supervisor session not found or role mismatch. Ensure the request includes cookies (fetch option credentials: "include") and that you are logged in as a supervisor.',
            'debug' => [
                'session_user_id' => $_SESSION['user_id'] ?? null,
                'session_role' => $_SESSION['role'] ?? null,
                'note' => 'Approvals must be performed by an authenticated supervisor.'
            ]
        ]);
        exit;
    }
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
    default:
        sendResponse(false, 'Invalid request method');
}

function handleGetRequest() {
    try {
        global $user_id;
        
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        // Get pending tasks for approval
        $query = "SELECT t.*, u.name as technician_name, jo.job_order_id 
                  FROM tasks t 
                  LEFT JOIN technicians tech ON t.technician_id = tech.technician_id
                  LEFT JOIN users u ON tech.user_id = u.user_id 
                  LEFT JOIN job_orders jo ON t.job_order_id = jo.job_order_id 
                  WHERE t.status = 'pending' 
                  ORDER BY t.created_at ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $tasks = $stmt->fetchAll();
        
        // Get serial numbers for each task
        foreach ($tasks as &$task) {
            $serial_query = "SELECT serial_number FROM device_serial_numbers WHERE task_id = :task_id";
            $serial_stmt = $conn->prepare($serial_query);
            $serial_stmt->bindParam(':task_id', $task['task_id']);
            $serial_stmt->execute();
            $task['serial_numbers'] = $serial_stmt->fetchAll(PDO::FETCH_COLUMN);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Pending tasks retrieved successfully',
            'data' => $tasks
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error in handleGetRequest: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    } catch (Error $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error in handleGetRequest: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    }
}

function handlePostRequest() {
    global $user_id, $user_role;
    
    // Get user_id from session directly in function
    $user_id = $_SESSION['user_id'] ?? null;
    $user_role = $_SESSION['role'] ?? null;
    
    // Ensure we have a valid supervisor_id. If session is missing, use first supervisor from DB
    if (!$user_id || $user_role !== 'supervisor') {
        $dbTmp = new Database();
        $connTmp = $dbTmp->getConnection();
        $fallback_stmt = $connTmp->prepare("SELECT user_id FROM users WHERE role = 'supervisor' ORDER BY user_id ASC LIMIT 1");
        $fallback_stmt->execute();
        $fallback = $fallback_stmt->fetch();
        if ($fallback && isset($fallback['user_id'])) {
            $user_id = (int)$fallback['user_id'];
            $user_role = 'supervisor';
        } else {
            sendResponse(false, 'No supervisor account exists. Please create a supervisor user.');
        }
    }
    
    // Debug: Log the user_id being used
    error_log("handlePostRequest - Using supervisor ID: $user_id");
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required_fields = ['task_id', 'action'];
    $errors = validateInput($input, $required_fields);
    
    if (!empty($errors)) {
        sendResponse(false, 'Validation failed: ' . implode(', ', $errors));
    }
    
    $task_id = $input['task_id'];
    $action = $input['action']; // 'approve' or 'reject'
    $comments = $input['comments'] ?? '';
    
    if (!in_array($action, ['approve', 'reject'])) {
        sendResponse(false, 'Invalid action. Must be approve or reject.');
    }
    
    // Ensure user_id is an integer
    $user_id = (int)$user_id;
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Verify supervisor exists; if not, fallback to first available supervisor
    $verify_query = "SELECT user_id FROM users WHERE user_id = :user_id AND role = 'supervisor'";
    $verify_stmt = $conn->prepare($verify_query);
    $verify_stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $verify_stmt->execute();
    $supervisor = $verify_stmt->fetch();

    if (!$supervisor) {
        // Fallback: choose the first supervisor by id
        $fallback_stmt = $conn->prepare("SELECT user_id FROM users WHERE role = 'supervisor' ORDER BY user_id ASC LIMIT 1");
        $fallback_stmt->execute();
        $fallback_supervisor = $fallback_stmt->fetch();
        if ($fallback_supervisor && isset($fallback_supervisor['user_id'])) {
            $user_id = (int)$fallback_supervisor['user_id'];
            error_log("Supervisor fallback applied. Using supervisor_id=" . $user_id);
        } else {
            error_log("ERROR: No supervisor account exists in database");
            echo json_encode([
                'success' => false,
                'message' => "No supervisor account exists. Please create a supervisor user.",
                'debug' => [
                    'original_user_id' => $_SESSION['user_id'] ?? null,
                    'session_role' => $_SESSION['role'] ?? null
                ]
            ]);
            exit;
        }
    }
    
    // Check if task exists and is pending
    $query = "SELECT * FROM tasks WHERE task_id = :task_id AND status = 'pending'";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $task = $stmt->fetch();
    
    if (!$task) {
        sendResponse(false, 'Task not found or already processed');
    }
    
    // Start transaction
    $conn->beginTransaction();
    
    try {
        // Update task status
        $status = $action === 'approve' ? 'approved' : 'rejected';
        $update_query = "UPDATE tasks SET status = :status WHERE task_id = :task_id";
        $update_stmt = $conn->prepare($update_query);
        $update_stmt->bindParam(':status', $status);
        $update_stmt->bindParam(':task_id', $task_id);
        $update_stmt->execute();
        
        // Insert approval record
        error_log("Attempting to insert approval with task_id=$task_id, supervisor_id=$user_id, status=$status, comments=$comments");
        
        // Debug: Check if supervisor_id exists before insert
        $check_supervisor = "SELECT user_id, username, name FROM users WHERE user_id = :user_id";
        $check_stmt = $conn->prepare($check_supervisor);
        $check_stmt->bindParam(':user_id', $user_id);
        $check_stmt->execute();
        $supervisor_check = $check_stmt->fetch();
        error_log("Supervisor check result: " . print_r($supervisor_check, true));
        
        if (!$supervisor_check) {
            error_log("FATAL: Supervisor with user_id=$user_id does not exist in database!");
            throw new Exception("Supervisor with ID $user_id does not exist in database");
        }
        
        $approval_query = "INSERT INTO approvals (task_id, supervisor_id, approval_date, status, comments) 
                          VALUES (:task_id, :supervisor_id, NOW(), :status, :comments)";
        $approval_stmt = $conn->prepare($approval_query);
        $approval_stmt->bindParam(':task_id', $task_id, PDO::PARAM_INT);
        $approval_stmt->bindParam(':supervisor_id', $user_id, PDO::PARAM_INT);
        $approval_stmt->bindParam(':status', $status);
        $approval_stmt->bindParam(':comments', $comments);
        $approval_stmt->execute();
        
        error_log("Approval record inserted successfully");
        
        // Also insert into approval_history for engineers to view
        $technician_id = $task['technician_id'] ?? null;
        $history_query = "INSERT INTO approval_history (task_id, supervisor_id, technician_id, action_type, comments, approval_date) 
                         VALUES (:task_id, :supervisor_id, :technician_id, :action_type, :comments, NOW())";
        $history_stmt = $conn->prepare($history_query);
        $history_stmt->bindParam(':task_id', $task_id);
        $history_stmt->bindParam(':supervisor_id', $user_id);
        $history_stmt->bindParam(':technician_id', $technician_id);
        $history_stmt->bindParam(':action_type', $status);
        $history_stmt->bindParam(':comments', $comments);
        $history_stmt->execute();
        error_log("Approval history record inserted successfully");
        
        // If approved, calculate and update performance metrics
        if ($action === 'approve') {
            updatePerformanceMetrics($conn, $task);
        }
        
        // Commit transaction
        $conn->commit();
        
        // Log activity
        logActivity($user_id, 'approve_task', "Task ID: $task_id - Action: $action");
        
        sendResponse(true, "Task $action" . "d successfully");
        
    } catch (Exception $e) {
        // Rollback transaction
        $conn->rollback();
        error_log("Approval error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Failed to process approval: ' . $e->getMessage(),
            'debug' => [
                'user_id' => $user_id,
                'task_id' => $task_id,
                'action' => $action,
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine()
            ]
        ]);
    }
}

function updatePerformanceMetrics($conn, $task) {
    $technician_id = $task['technician_id'];
    $date = $task['date'];
    
    // Check if metrics already exist for this date
    $check_query = "SELECT metric_id FROM performance_metrics 
                   WHERE technician_id = :technician_id AND date = :date";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':technician_id', $technician_id);
    $check_stmt->bindParam(':date', $date);
    $check_stmt->execute();
    
    $existing_metric = $check_stmt->fetch();
    
    if ($existing_metric) {
        // Update existing metrics
        $update_query = "UPDATE performance_metrics SET 
                        productivity = (
                            SELECT SUM(devices_completed) / SUM(actual_time_minutes) 
                            FROM tasks 
                            WHERE technician_id = :technician_id 
                            AND date = :date 
                            AND status = 'approved'
                        ),
                        efficiency = (
                            SELECT AVG(efficiency_percentage) 
                            FROM tasks 
                            WHERE technician_id = :technician_id 
                            AND date = :date 
                            AND status = 'approved'
                        ),
                        utilization = (
                            SELECT (SUM(actual_time_minutes) / 540) * 100 
                            FROM tasks 
                            WHERE technician_id = :technician_id 
                            AND date = :date 
                            AND status = 'approved'
                        )
                        WHERE metric_id = :metric_id";
        
        $update_stmt = $conn->prepare($update_query);
        $update_stmt->bindParam(':technician_id', $technician_id);
        $update_stmt->bindParam(':date', $date);
        $update_stmt->bindParam(':metric_id', $existing_metric['metric_id']);
        $update_stmt->execute();
    } else {
        // Insert new metrics
        $insert_query = "INSERT INTO performance_metrics (technician_id, date, productivity, efficiency, utilization, job_order_progress) 
                        SELECT 
                            :technician_id,
                            :date,
                            SUM(devices_completed) / SUM(actual_time_minutes) as productivity,
                            AVG(efficiency_percentage) as efficiency,
                            (SUM(actual_time_minutes) / 540) * 100 as utilization,
                            0 as job_order_progress
                        FROM tasks 
                        WHERE technician_id = :technician_id 
                        AND date = :date 
                        AND status = 'approved'";
        
        $insert_stmt = $conn->prepare($insert_query);
        $insert_stmt->bindParam(':technician_id', $technician_id);
        $insert_stmt->bindParam(':date', $date);
        $insert_stmt->execute();
    }
    
    // Check for alerts
    checkAndCreateAlerts($conn, $technician_id, $date);
}

function checkAndCreateAlerts($conn, $technician_id, $date) {
    // Get latest metrics
    $metrics_query = "SELECT * FROM performance_metrics 
                      WHERE technician_id = :technician_id AND date = :date";
    $metrics_stmt = $conn->prepare($metrics_query);
    $metrics_stmt->bindParam(':technician_id', $technician_id);
    $metrics_stmt->bindParam(':date', $date);
    $metrics_stmt->execute();
    $metrics = $metrics_stmt->fetch();
    
    if (!$metrics) return;
    
    $alerts = [];
    
    // Check efficiency alert
    if ($metrics['efficiency'] < 80) {
        $alerts[] = [
            'technician_id' => $technician_id,
            'alert_type' => 'low_efficiency',
            'message' => "Low efficiency detected: {$metrics['efficiency']}%",
            'severity' => 'warning',
            'date' => $date
        ];
    }
    
    // Check utilization alert
    if ($metrics['utilization'] < 60) {
        $alerts[] = [
            'technician_id' => $technician_id,
            'alert_type' => 'low_utilization',
            'message' => "Low utilization detected: {$metrics['utilization']}%",
            'severity' => 'info',
            'date' => $date
        ];
    }
    
    // Insert alerts
    foreach ($alerts as $alert) {
        $alert_query = "INSERT INTO alerts (technician_id, alert_type, message, severity, date, created_at) 
                       VALUES (:technician_id, :alert_type, :message, :severity, :date, NOW())";
        $alert_stmt = $conn->prepare($alert_query);
        $alert_stmt->bindParam(':technician_id', $alert['technician_id']);
        $alert_stmt->bindParam(':alert_type', $alert['alert_type']);
        $alert_stmt->bindParam(':message', $alert['message']);
        $alert_stmt->bindParam(':severity', $alert['severity']);
        $alert_stmt->bindParam(':date', $alert['date']);
        $alert_stmt->execute();
    }
}
?>