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

    // Check authentication
    session_start();
    if (!isset($_SESSION['user_id'])) {
        sendResponse(false, 'Authentication required');
    }
    
    $user_id = $_SESSION['user_id'];
    $user_role = $_SESSION['role'] ?? 'technician';
    
    // Only technicians and engineers can submit task completions
    if ($user_role !== 'technician' && $user_role !== 'engineer') {
        sendResponse(false, 'Only technicians and engineers can submit task completions');
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
    case 'POST':
        handlePostRequest();
        break;
    default:
        sendResponse(false, 'Invalid request method');
}

function handlePostRequest() {
    global $user_id, $user_role;
    
    // Debug: Log received data
    error_log("Task completion POST data: " . print_r($_POST, true));
    error_log("Files data: " . print_r($_FILES, true));
    
    // Validate required fields
    $required_fields = ['job_order_id', 'operation', 'actual_time_minutes', 'serial_numbers'];
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field]) || empty($_POST[$field])) {
            sendResponse(false, "Missing required field: $field");
            return;
        }
    }
    
    $job_order_id = $_POST['job_order_id'];
    $operation = $_POST['operation'];
    $actual_time_minutes = intval($_POST['actual_time_minutes']);
    $serial_numbers = json_decode($_POST['serial_numbers'], true);
    $notes = $_POST['notes'] ?? '';
    
    // Validate serial numbers
    if (!is_array($serial_numbers) || empty($serial_numbers)) {
        sendResponse(false, 'Serial numbers must be provided');
        return;
    }
    
    // Validate actual time
    if ($actual_time_minutes <= 0) {
        sendResponse(false, 'Actual time must be greater than 0');
        return;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Start transaction
    $conn->beginTransaction();
    
    try {
        // Get operation details
        $operation_query = "SELECT operation_id, standard_time FROM operations WHERE operation_name = :operation_name";
        $operation_stmt = $conn->prepare($operation_query);
        $operation_stmt->bindValue(':operation_name', $operation);
        $operation_stmt->execute();
        $operation_data = $operation_stmt->fetch();
        
        if (!$operation_data) {
            throw new Exception('Operation not found');
        }
        
        $operation_id = $operation_data['operation_id'];
        $standard_time = $operation_data['standard_time'];
        
        // Calculate efficiency
        $efficiency_percentage = $standard_time > 0 ? round(($standard_time / $actual_time_minutes) * 100, 2) : 0;
        
        // Get technician_id from user_id
        $technician_query = "SELECT technician_id FROM technicians WHERE user_id = :user_id";
        $technician_stmt = $conn->prepare($technician_query);
        $technician_stmt->bindValue(':user_id', $user_id);
        $technician_stmt->execute();
        $technician = $technician_stmt->fetch();
        
        if (!$technician) {
            throw new Exception('Technician record not found for user');
        }
        
        $technician_id = $technician['technician_id'];
        
        // Insert task completion record
        $task_query = "INSERT INTO tasks (
            job_order_id, 
            technician_id, 
            operation_name, 
            actual_time_minutes, 
            standard_time_minutes, 
            efficiency_percentage, 
            devices_completed, 
            notes, 
            status, 
            date, 
            created_at
        ) VALUES (
            :job_order_id, 
            :technician_id, 
            :operation_name, 
            :actual_time_minutes, 
            :standard_time_minutes, 
            :efficiency_percentage, 
            :devices_completed, 
            :notes, 
            'pending', 
            CURDATE(), 
            NOW()
        )";
        
        $task_stmt = $conn->prepare($task_query);
        $task_stmt->bindValue(':job_order_id', $job_order_id);
        $task_stmt->bindValue(':technician_id', $technician_id);
        $task_stmt->bindValue(':operation_name', $operation);
        $task_stmt->bindValue(':actual_time_minutes', $actual_time_minutes);
        $task_stmt->bindValue(':standard_time_minutes', $standard_time);
        $task_stmt->bindValue(':efficiency_percentage', $efficiency_percentage);
        $task_stmt->bindValue(':devices_completed', count($serial_numbers));
        $task_stmt->bindValue(':notes', $notes);
        
        if (!$task_stmt->execute()) {
            throw new Exception('Failed to insert task completion record');
        }
        
        $task_id = $conn->lastInsertId();
        
        // Insert serial numbers into device_serial_numbers table
        if (!empty($serial_numbers)) {
            $serial_query = "INSERT INTO device_serial_numbers (task_id, serial_number, completion_date, completion_time) VALUES (:task_id, :serial_number, CURDATE(), CURTIME())";
            $serial_stmt = $conn->prepare($serial_query);
            
            foreach ($serial_numbers as $serial) {
                if (!empty(trim($serial))) {
                    $serial_stmt->bindValue(':task_id', $task_id);
                    $serial_stmt->bindValue(':serial_number', trim($serial));
                    $serial_stmt->execute();
                }
            }
        }
        
        // Handle file uploads if any
        $uploaded_files = [];
        if (isset($_FILES)) {
            $upload_dir = '../uploads/task_completion/' . $task_id . '/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            foreach ($_FILES as $key => $file) {
                if (strpos($key, 'file_') === 0 && $file['error'] === UPLOAD_ERR_OK) {
                    $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                    $new_filename = uniqid() . '_' . $file['name'];
                    $upload_path = $upload_dir . $new_filename;
                    
                    if (move_uploaded_file($file['tmp_name'], $upload_path)) {
                        $uploaded_files[] = [
                            'original_name' => $file['name'],
                            'stored_name' => $new_filename,
                            'path' => $upload_path,
                            'size' => $file['size']
                        ];
                    }
                }
            }
        }
        
        // Update job order progress
        $progress_query = "UPDATE job_orders 
                          SET progress_percentage = (
                              SELECT COALESCE(
                                  ROUND((SUM(devices_completed) / total_devices) * 100, 1), 
                                  0
                              ) 
                              FROM tasks 
                              WHERE job_order_id = :job_order_id 
                              AND status IN ('pending', 'approved')
                          )
                          WHERE job_order_id = :job_order_id";
        
        $progress_stmt = $conn->prepare($progress_query);
        $progress_stmt->bindValue(':job_order_id', $job_order_id);
        $progress_stmt->execute();
        
        // Create notification for supervisor
        $notification_query = "INSERT INTO supervisor_notifications (
            job_order_id, 
            technician_id, 
            task_id, 
            notification_type, 
            message, 
            status, 
            created_at
        ) VALUES (
            :job_order_id, 
            :technician_id, 
            :task_id, 
            'task_completion', 
            :message, 
            'pending', 
            NOW()
        )";
        
        $message = "Task completion submitted by technician for Job Order {$job_order_id}. Operation: {$operation}, Devices: " . count($serial_numbers) . ", Time: {$actual_time_minutes} minutes";
        
        $notification_stmt = $conn->prepare($notification_query);
        $notification_stmt->bindValue(':job_order_id', $job_order_id);
        $notification_stmt->bindValue(':technician_id', $technician_id);
        $notification_stmt->bindValue(':task_id', $task_id);
        $notification_stmt->bindValue(':message', $message);
        $notification_stmt->execute();
        
        // Commit transaction
        $conn->commit();
        
        // Send response
        sendResponse(true, 'Task completion submitted successfully', [
            'task_id' => $task_id,
            'efficiency_percentage' => $efficiency_percentage,
            'uploaded_files' => $uploaded_files
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction
        $conn->rollback();
        error_log("Task completion error: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        sendResponse(false, 'Error processing task completion: ' . $e->getMessage());
    }
}
?>
