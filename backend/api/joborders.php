<?php
// Set CORS headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

// Temporary fix: Skip authentication for testing
// TODO: Implement proper API authentication
$user_id = 1; // Default to admin for testing
$user_role = 'engineer';

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
    global $user_role;
    
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
    
    if ($stmt->execute()) {
        logActivity($user_id, 'create_job_order', "Created job order: {$input['job_order_id']}");
        sendResponse(true, 'Job order created successfully');
    } else {
        sendResponse(false, 'Failed to create job order');
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
        logActivity($user_id, 'update_job_order', "Updated job order: $job_order_id");
        sendResponse(true, 'Job order updated successfully');
    } else {
        sendResponse(false, 'Failed to update job order');
    }
}
?>