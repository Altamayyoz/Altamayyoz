<?php
// Set CORS headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

// Check authentication
session_start();
if (!isset($_SESSION['user_id'])) {
    sendResponse(false, 'Authentication required');
}

$user_id = $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? '';

// Only supervisors can access this endpoint
if ($user_role !== 'supervisor') {
    sendResponse(false, 'Access denied. Supervisor role required.');
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        sendResponse(false, 'Database connection failed');
    }
    
    // Get pending task completions with technician and job order details
    $query = "SELECT 
        t.task_id,
        t.job_order_id,
        t.operation_name,
        t.actual_time_minutes,
        t.standard_time_minutes,
        t.efficiency_percentage,
        t.devices_completed,
        t.notes,
        t.status,
        t.date,
        t.created_at,
        u.name as technician_name,
        u.username as technician_username,
        j.total_devices,
        j.due_date,
        j.priority,
        j.description as job_description
    FROM tasks t
    JOIN technicians tech ON t.technician_id = tech.technician_id
    JOIN users u ON tech.user_id = u.user_id
    JOIN job_orders j ON t.job_order_id = j.job_order_id
    WHERE t.status = 'pending'
    ORDER BY t.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $tasks = $stmt->fetchAll();
    
    // Get serial numbers for each task
    foreach ($tasks as &$task) {
        $serial_query = "SELECT serial_number FROM device_serial_numbers WHERE task_id = :task_id";
        $serial_stmt = $conn->prepare($serial_query);
        $serial_stmt->bindValue(':task_id', $task['task_id']);
        $serial_stmt->execute();
        $serials = $serial_stmt->fetchAll(PDO::FETCH_COLUMN);
        $task['serial_numbers'] = $serials;
    }
    
    sendResponse(true, 'Pending tasks retrieved successfully', $tasks);
    
} catch (Exception $e) {
    error_log("Supervisor tasks error: " . $e->getMessage());
    sendResponse(false, 'Error retrieving pending tasks: ' . $e->getMessage());
}
?>
