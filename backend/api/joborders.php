<?php
// Turn off error display to prevent HTML output before JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set CORS headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

// Get authenticated user from session
session_start();
$user_id = $_SESSION['user_id'] ?? 1; // Default to admin for testing
$user_role = $_SESSION['role'] ?? 'engineer';

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
    global $user_role;
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $status = $_GET['status'] ?? null;
    
    $query = "SELECT jo.*, 
              COUNT(t.task_id) as total_tasks,
              SUM(t.devices_completed) as completed_devices,
              AVG(t.efficiency_percentage) as avg_efficiency
              FROM job_orders jo
              LEFT JOIN tasks t ON jo.job_order_id = t.job_order_id AND t.status = 'approved'
              WHERE 1=1";
    
    $params = [];
    
    if ($status) {
        $query .= " AND jo.status = :status";
        $params[':status'] = $status;
    }
    
    $query .= " GROUP BY jo.job_order_id ORDER BY jo.created_date DESC";
    
    $stmt = $conn->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    $job_orders = $stmt->fetchAll();
    
    // Calculate progress for each job order
    foreach ($job_orders as &$job_order) {
        $job_order['progress_percentage'] = $job_order['total_devices'] > 0 
            ? round(($job_order['completed_devices'] / $job_order['total_devices']) * 100, 1)
            : 0;
        
        // Determine status based on progress and due date
        $due_date = new DateTime($job_order['due_date']);
        $today = new DateTime();
        
        if ($job_order['progress_percentage'] >= 100) {
            $job_order['status'] = 'completed';
        } elseif ($due_date < $today) {
            $job_order['status'] = 'overdue';
        } elseif ($due_date->diff($today)->days <= 2) {
            $job_order['status'] = 'due_soon';
        } else {
            $job_order['status'] = 'active';
        }
    }
    
    sendResponse(true, 'Job orders retrieved successfully', $job_orders);
}

function handlePostRequest() {
    global $user_role, $user_id;
    
    // Only engineers can create job orders
    if ($user_role !== 'engineer') {
        sendResponse(false, 'Access denied. Engineer role required.');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required_fields = ['job_order_id', 'total_devices', 'due_date'];
    $errors = validateInput($input, $required_fields);
    
    if (!empty($errors)) {
        sendResponse(false, 'Validation failed: ' . implode(', ', $errors));
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Check if job order already exists
    $check_query = "SELECT job_order_id FROM job_orders WHERE job_order_id = :job_order_id";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':job_order_id', $input['job_order_id']);
    $check_stmt->execute();
    
    if ($check_stmt->fetch()) {
        sendResponse(false, 'Job order ID already exists');
    }
    
    // Insert job order
    $query = "INSERT INTO job_orders (job_order_id, total_devices, due_date, created_date, status) 
              VALUES (:job_order_id, :total_devices, :due_date, NOW(), 'active')";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':job_order_id', $input['job_order_id']);
    $stmt->bindParam(':total_devices', $input['total_devices']);
    $stmt->bindParam(':due_date', $input['due_date']);
    
    try {
        if ($stmt->execute()) {
            // Log activity for Planning Engineer
            if (function_exists('logActivity')) {
                logActivity($user_id, 'create_job_order', "Created job order: {$input['job_order_id']} (Devices: {$input['total_devices']}, Due: {$input['due_date']})");
            }
            
            // Create alert for Admin to notify about new job order
            try {
                $alert_query = "INSERT INTO alerts (technician_id, alert_type, message, severity, date, read_status, created_at) 
                               VALUES (NULL, 'info', ?, 'info', CURDATE(), FALSE, NOW())";
                $alert_msg = "Planning Engineer created new job order: {$input['job_order_id']}";
                $alert_stmt = $conn->prepare($alert_query);
                $alert_stmt->bindParam(1, $alert_msg);
                $alert_stmt->execute();
            } catch (Exception $e) {
                // Log error but don't fail the job order creation
                error_log("Alert creation error: " . $e->getMessage());
            }
            
            sendResponse(true, 'Job order created successfully');
        } else {
            sendResponse(false, 'Failed to create job order');
        }
    } catch (PDOException $e) {
        error_log("Job order creation error: " . $e->getMessage());
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

function handlePutRequest() {
    global $user_role;
    
    // Only engineers can update job orders
    if ($user_role !== 'engineer') {
        sendResponse(false, 'Access denied. Engineer role required.');
    }
    
    $job_order_id = $_GET['id'] ?? null;
    if (!$job_order_id) {
        sendResponse(false, 'Job order ID required');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Check if job order exists
    $check_query = "SELECT * FROM job_orders WHERE job_order_id = :job_order_id";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':job_order_id', $job_order_id);
    $check_stmt->execute();
    
    if (!$check_stmt->fetch()) {
        sendResponse(false, 'Job order not found');
    }
    
    // Update job order
    $query = "UPDATE job_orders SET ";
    $updates = [];
    $params = [':job_order_id' => $job_order_id];
    
    $allowed_fields = ['total_devices', 'due_date', 'status'];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }
    
    if (empty($updates)) {
        sendResponse(false, 'No fields to update');
    }
    
    $query .= implode(', ', $updates) . " WHERE job_order_id = :job_order_id";
    
    $stmt = $conn->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    if ($stmt->execute()) {
        // Log activity for Planning Engineer
        $update_details = [];
        if (isset($input['total_devices'])) $update_details[] = "Devices: {$input['total_devices']}";
        if (isset($input['due_date'])) $update_details[] = "Due Date: {$input['due_date']}";
        if (isset($input['status'])) $update_details[] = "Status: {$input['status']}";
        
        $details = !empty($update_details) ? implode(', ', $update_details) : "Updated job order: $job_order_id";
        logActivity($user_id, 'update_job_order', "Updated job order: $job_order_id ($details)");
        
        // Create alert for Admin if status changed to critical
        if (isset($input['status']) && in_array($input['status'], ['overdue', 'delayed'])) {
            $alert_query = "INSERT INTO alerts (technician_id, alert_type, message, severity, date, read_status, created_at) 
                           VALUES (NULL, 'critical', 'Planning Engineer updated job order $job_order_id status to {$input['status']}', 'critical', CURDATE(), FALSE, NOW())";
            $alert_stmt = $conn->prepare($alert_query);
            $alert_stmt->execute();
        }
        
        sendResponse(true, 'Job order updated successfully');
    } else {
        sendResponse(false, 'Failed to update job order');
    }
}

function handleDeleteRequest() {
    global $user_role, $user_id;
    
    // Only engineers can delete job orders
    if ($user_role !== 'engineer') {
        sendResponse(false, 'Access denied. Engineer role required.');
    }
    
    $job_order_id = $_GET['id'] ?? null;
    if (!$job_order_id) {
        sendResponse(false, 'Job order ID required');
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Check if job order exists
    $check_query = "SELECT * FROM job_orders WHERE job_order_id = :job_order_id";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':job_order_id', $job_order_id);
    $check_stmt->execute();
    
    if (!$check_stmt->fetch()) {
        sendResponse(false, 'Job order not found');
    }
    
    // Check if there are associated tasks (prevent deletion if tasks exist)
    $tasks_query = "SELECT COUNT(*) as task_count FROM tasks WHERE job_order_id = :job_order_id";
    $tasks_stmt = $conn->prepare($tasks_query);
    $tasks_stmt->bindParam(':job_order_id', $job_order_id);
    $tasks_stmt->execute();
    $task_count = $tasks_stmt->fetch()['task_count'];
    
    if ($task_count > 0) {
        sendResponse(false, 'Cannot delete job order with associated tasks. Please remove tasks first.');
    }
    
    // Delete job order
    $query = "DELETE FROM job_orders WHERE job_order_id = :job_order_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':job_order_id', $job_order_id);
    
    if ($stmt->execute()) {
        // Log activity
        logActivity($user_id, 'delete_job_order', "Deleted job order: $job_order_id");
        
        // Create alert for Admin
        $alert_query = "INSERT INTO alerts (technician_id, alert_type, message, severity, date, read_status, created_at) 
                       VALUES (NULL, 'warning', 'Planning Engineer deleted job order: $job_order_id', 'warning', CURDATE(), FALSE, NOW())";
        $alert_stmt = $conn->prepare($alert_query);
        $alert_stmt->execute();
        
        sendResponse(true, 'Job order deleted successfully');
    } else {
        sendResponse(false, 'Failed to delete job order');
    }
}
?>