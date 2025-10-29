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
    $user_id = 3; // Default to first technician for testing
    $user_role = 'technician';
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
        sendResponse(false, 'Invalid request method');
}

function handleGetRequest() {
    global $user_id, $user_role;
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $technician_id = $_GET['technician_id'] ?? null;
    $date = $_GET['date'] ?? null;
    
    $query = "SELECT t.*, u.name as technician_name, jo.job_order_id 
              FROM tasks t 
              LEFT JOIN technicians tech ON t.technician_id = tech.technician_id 
              LEFT JOIN users u ON tech.user_id = u.user_id 
              LEFT JOIN job_orders jo ON t.job_order_id = jo.job_order_id 
              WHERE 1=1";
    
    $params = [];
    
    if ($technician_id) {
        $query .= " AND t.technician_id = :technician_id";
        $params['technician_id'] = $technician_id;
    }
    
    if ($date) {
        $query .= " AND DATE(t.date) = :date";
        $params['date'] = $date;
    }
    
    // Role-based filtering
    if ($user_role === 'technician') {
        // Get technician_id from user_id
        $technician_query = "SELECT technician_id FROM technicians WHERE user_id = :user_id";
        $technician_stmt = $conn->prepare($technician_query);
        $technician_stmt->bindParam(':user_id', $user_id);
        $technician_stmt->execute();
        $technician = $technician_stmt->fetch();
        
        if ($technician) {
            $query .= " AND t.technician_id = :technician_id";
            $params['technician_id'] = $technician['technician_id'];
        } else {
            // If no technician record found, return empty result
            $query .= " AND 1=0";
        }
    }
    
    $query .= " ORDER BY t.created_at DESC";
    
    $stmt = $conn->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }
    
    $stmt->execute();
    $tasks = $stmt->fetchAll();
    
    sendResponse(true, 'Tasks retrieved successfully', $tasks);
}

function handlePostRequest() {
    try {
        global $user_id, $user_role;
        
        if ($user_role !== 'technician') {
            echo json_encode([
                'success' => false,
                'message' => 'Only technicians can create tasks'
            ]);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON input'
            ]);
            return;
        }
        
        // Validate required fields
        $required_fields = ['date', 'job_order_id', 'operation_name', 'devices_completed', 'actual_time_minutes'];
        $errors = [];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                $errors[] = $field . ' is required';
            }
        }
        
        if (!empty($errors)) {
            echo json_encode([
                'success' => false,
                'message' => 'Validation failed: ' . implode(', ', $errors)
            ]);
            return;
        }
        
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed'
            ]);
            return;
        }
        
        // Get standard time for operation
        $standard_time = 30; // Default
        try {
            $standard_query = "SELECT standard_time_minutes FROM operations WHERE operation_name = :operation_name";
            $standard_stmt = $conn->prepare($standard_query);
            $standard_stmt->bindParam(':operation_name', $input['operation_name']);
            $standard_stmt->execute();
            $operation = $standard_stmt->fetch();
            if ($operation) {
                $standard_time = $operation['standard_time_minutes'];
            }
        } catch (Exception $e) {
            // Use default if operation not found
        }
        
        // Calculate efficiency
        $efficiency = ($standard_time / $input['actual_time_minutes']) * 100;
        
        // Get technician_id from user_id
        $technician_query = "SELECT technician_id FROM technicians WHERE user_id = :user_id";
        $technician_stmt = $conn->prepare($technician_query);
        $technician_stmt->bindParam(':user_id', $user_id);
        $technician_stmt->execute();
        $technician = $technician_stmt->fetch();
        
        if (!$technician) {
            echo json_encode([
                'success' => false,
                'message' => 'Technician record not found for user_id: ' . $user_id
            ]);
            return;
        }
        
        $technician_id = $technician['technician_id'];
        
        // Insert task
        $query = "INSERT INTO tasks (technician_id, job_order_id, date, operation_name, devices_completed, 
                  actual_time_minutes, standard_time_minutes, efficiency_percentage, notes, status, created_at) 
                  VALUES (:technician_id, :job_order_id, :date, :operation_name, :devices_completed, 
                  :actual_time_minutes, :standard_time_minutes, :efficiency_percentage, :notes, 'pending', NOW())";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':technician_id', $technician_id);
        $stmt->bindParam(':job_order_id', $input['job_order_id']);
        $stmt->bindParam(':date', $input['date']);
        $stmt->bindParam(':operation_name', $input['operation_name']);
        $stmt->bindParam(':devices_completed', $input['devices_completed']);
        $stmt->bindParam(':actual_time_minutes', $input['actual_time_minutes']);
        $stmt->bindParam(':standard_time_minutes', $standard_time);
        $stmt->bindParam(':efficiency_percentage', $efficiency);
        
        $notes = $input['notes'] ?? '';
        $stmt->bindParam(':notes', $notes);
        
        if ($stmt->execute()) {
            $task_id = $conn->lastInsertId();
            
            // Insert device serial numbers if provided
            if (isset($input['serial_numbers']) && is_array($input['serial_numbers'])) {
                try {
                    $serial_query = "INSERT INTO device_serial_numbers (task_id, serial_number) VALUES (:task_id, :serial_number)";
                    $serial_stmt = $conn->prepare($serial_query);
                    
                    foreach ($input['serial_numbers'] as $serial) {
                        if (!empty(trim($serial))) {
                            $serial_stmt->bindParam(':task_id', $task_id);
                            $serial_stmt->bindParam(':serial_number', $serial);
                            $serial_stmt->execute();
                        }
                    }
                } catch (Exception $e) {
                    // Continue even if serial numbers fail
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Task created successfully',
                'data' => [
                    'task_id' => $task_id,
                    'technician_id' => $technician_id,
                    'efficiency_percentage' => $efficiency
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create task'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error in handlePostRequest: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    } catch (Error $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error in handlePostRequest: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    }
}

function handlePutRequest() {
    global $user_id, $user_role;
    
    $task_id = $_GET['id'] ?? null;
    if (!$task_id) {
        sendResponse(false, 'Task ID required');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Check if user can edit this task
    $query = "SELECT technician_id FROM tasks WHERE task_id = :task_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $task = $stmt->fetch();
    
    if (!$task) {
        sendResponse(false, 'Task not found');
    }
    
    if ($user_role === 'technician' && $task['technician_id'] != $user_id) {
        sendResponse(false, 'You can only edit your own tasks');
    }
    
    // Update task
    $query = "UPDATE tasks SET ";
    $updates = [];
    $params = [':task_id' => $task_id];
    
    $allowed_fields = ['operation_name', 'devices_completed', 'actual_time_minutes', 'notes'];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }
    
    if (empty($updates)) {
        sendResponse(false, 'No fields to update');
    }
    
    $query .= implode(', ', $updates) . " WHERE task_id = :task_id";
    
    $stmt = $conn->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    if ($stmt->execute()) {
        logActivity($user_id, 'update_task', "Updated task ID: $task_id");
        sendResponse(true, 'Task updated successfully');
    } else {
        sendResponse(false, 'Failed to update task');
    }
}

function handleDeleteRequest() {
    global $user_id, $user_role;
    
    $task_id = $_GET['id'] ?? null;
    if (!$task_id) {
        sendResponse(false, 'Task ID required');
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Check if user can delete this task
    $query = "SELECT technician_id, status FROM tasks WHERE task_id = :task_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    $stmt->execute();
    $task = $stmt->fetch();
    
    if (!$task) {
        sendResponse(false, 'Task not found');
    }
    
    if ($user_role === 'technician' && $task['technician_id'] != $user_id) {
        sendResponse(false, 'You can only delete your own tasks');
    }
    
    if ($task['status'] !== 'pending') {
        sendResponse(false, 'Only pending tasks can be deleted');
    }
    
    // Delete task
    $query = "DELETE FROM tasks WHERE task_id = :task_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':task_id', $task_id);
    
    if ($stmt->execute()) {
        logActivity($user_id, 'delete_task', "Deleted task ID: $task_id");
        sendResponse(true, 'Task deleted successfully');
    } else {
        sendResponse(false, 'Failed to delete task');
    }
}

function getStandardTime($conn, $operation_name) {
    $query = "SELECT standard_time FROM operations WHERE operation_name = :operation_name";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':operation_name', $operation_name);
    $stmt->execute();
    
    $operation = $stmt->fetch();
    return $operation ? $operation['standard_time'] : 30; // Default 30 minutes
}

function insertSerialNumbers($conn, $task_id, $serial_numbers) {
    $query = "INSERT INTO device_serial_numbers (task_id, serial_number, completion_date, completion_time) 
              VALUES (:task_id, :serial_number, CURDATE(), CURTIME())";
    
    $stmt = $conn->prepare($query);
    
    foreach ($serial_numbers as $serial_number) {
        if (!empty(trim($serial_number))) {
            $stmt->bindParam(':task_id', $task_id);
            $stmt->bindParam(':serial_number', trim($serial_number));
            $stmt->execute();
        }
    }
}
?>