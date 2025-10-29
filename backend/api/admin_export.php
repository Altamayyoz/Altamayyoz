<?php
// Admin Export All Data API
require_once '../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    $exportData = [];
    
    // Export users (without passwords)
    $usersQuery = "SELECT user_id, username, role, name, email, created_at, updated_at FROM users";
    $usersStmt = $conn->prepare($usersQuery);
    $usersStmt->execute();
    $exportData['users'] = $usersStmt->fetchAll();
    
    // Export technicians
    $techQuery = "SELECT * FROM technicians";
    $techStmt = $conn->prepare($techQuery);
    $techStmt->execute();
    $exportData['technicians'] = $techStmt->fetchAll();
    
    // Export job orders
    $jobOrdersQuery = "SELECT * FROM job_orders";
    $jobOrdersStmt = $conn->prepare($jobOrdersQuery);
    $jobOrdersStmt->execute();
    $exportData['job_orders'] = $jobOrdersStmt->fetchAll();
    
    // Export tasks
    $tasksQuery = "SELECT * FROM tasks";
    $tasksStmt = $conn->prepare($tasksQuery);
    $tasksStmt->execute();
    $exportData['tasks'] = $tasksStmt->fetchAll();
    
    // Export devices
    $devicesQuery = "SELECT * FROM device_serial_numbers";
    $devicesStmt = $conn->prepare($devicesQuery);
    $devicesStmt->execute();
    $exportData['devices'] = $devicesStmt->fetchAll();
    
    // Export performance metrics
    $metricsQuery = "SELECT * FROM performance_metrics";
    $metricsStmt = $conn->prepare($metricsQuery);
    $metricsStmt->execute();
    $exportData['performance_metrics'] = $metricsStmt->fetchAll();
    
    // Export approvals
    $approvalsQuery = "SELECT * FROM approvals";
    $approvalsStmt = $conn->prepare($approvalsQuery);
    $approvalsStmt->execute();
    $exportData['approvals'] = $approvalsStmt->fetchAll();
    
    // Export alerts
    $alertsQuery = "SELECT * FROM alerts";
    $alertsStmt = $conn->prepare($alertsQuery);
    $alertsStmt->execute();
    $exportData['alerts'] = $alertsStmt->fetchAll();
    
    // Export activity logs
    $activityQuery = "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 1000";
    $activityStmt = $conn->prepare($activityQuery);
    $activityStmt->execute();
    $exportData['activity_logs'] = $activityStmt->fetchAll();
    
    // Export operations
    $operationsQuery = "SELECT * FROM operations";
    $operationsStmt = $conn->prepare($operationsQuery);
    $operationsStmt->execute();
    $exportData['operations'] = $operationsStmt->fetchAll();
    
    $exportData['export_date'] = date('Y-m-d H:i:s');
    $exportData['total_records'] = array_sum(array_map('count', $exportData));
    
    echo json_encode([
        'success' => true,
        'message' => 'Data exported successfully',
        'data' => $exportData
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error exporting data: ' . $e->getMessage()
    ]);
}
?>

