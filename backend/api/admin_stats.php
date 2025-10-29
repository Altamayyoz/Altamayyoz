<?php
// Admin Dashboard Stats API
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
    
    // Get total users
    $usersQuery = "SELECT COUNT(*) as total FROM users";
    $usersStmt = $conn->prepare($usersQuery);
    $usersStmt->execute();
    $totalUsers = $usersStmt->fetch()['total'];
    
    // Get active job orders
    $activeJobOrdersQuery = "SELECT COUNT(*) as total FROM job_orders WHERE status = 'active'";
    $activeJobOrdersStmt = $conn->prepare($activeJobOrdersQuery);
    $activeJobOrdersStmt->execute();
    $activeJobOrders = $activeJobOrdersStmt->fetch()['total'];
    
    // Get completed job orders
    $completedJobOrdersQuery = "SELECT COUNT(*) as total FROM job_orders WHERE status = 'completed'";
    $completedJobOrdersStmt = $conn->prepare($completedJobOrdersQuery);
    $completedJobOrdersStmt->execute();
    $completedJobOrders = $completedJobOrdersStmt->fetch()['total'];
    
    // Get pending approvals (tasks with status 'pending')
    $pendingApprovalsQuery = "SELECT COUNT(*) as total FROM tasks WHERE status = 'pending'";
    $pendingApprovalsStmt = $conn->prepare($pendingApprovalsQuery);
    $pendingApprovalsStmt->execute();
    $pendingApprovals = $pendingApprovalsStmt->fetch()['total'];
    
    // Get system alerts (unresolved alerts)
    $alertsQuery = "SELECT COUNT(*) as total FROM alerts WHERE read_status = FALSE";
    $alertsStmt = $conn->prepare($alertsQuery);
    $alertsStmt->execute();
    $systemAlerts = $alertsStmt->fetch()['total'];
    
    // Get total devices
    $totalDevicesQuery = "SELECT COUNT(*) as total FROM device_serial_numbers";
    $totalDevicesStmt = $conn->prepare($totalDevicesQuery);
    $totalDevicesStmt->execute();
    $totalDevices = $totalDevicesStmt->fetch()['total'];
    
    // Get completed devices (devices with completion date)
    $completedDevicesQuery = "SELECT COUNT(*) as total FROM device_serial_numbers WHERE completion_date IS NOT NULL";
    $completedDevicesStmt = $conn->prepare($completedDevicesQuery);
    $completedDevicesStmt->execute();
    $completedDevices = $completedDevicesStmt->fetch()['total'];
    
    // Get average efficiency from performance_metrics
    $efficiencyQuery = "SELECT AVG(efficiency) as avg_efficiency FROM performance_metrics";
    $efficiencyStmt = $conn->prepare($efficiencyQuery);
    $efficiencyStmt->execute();
    $avgEfficiency = $efficiencyStmt->fetch()['avg_efficiency'];
    $averageEfficiency = $avgEfficiency ? round($avgEfficiency, 1) : 0;
    
    // Calculate overall efficiency from tasks if no metrics exist
    if ($averageEfficiency == 0) {
        $taskEfficiencyQuery = "SELECT AVG(efficiency_percentage) as avg_efficiency FROM tasks WHERE status = 'approved'";
        $taskEfficiencyStmt = $conn->prepare($taskEfficiencyQuery);
        $taskEfficiencyStmt->execute();
        $taskAvgEfficiency = $taskEfficiencyStmt->fetch()['avg_efficiency'];
        $averageEfficiency = $taskAvgEfficiency ? round($taskAvgEfficiency, 1) : 75;
    }
    
    $stats = [
        'totalUsers' => (int)$totalUsers,
        'activeJobOrders' => (int)$activeJobOrders,
        'completedJobOrders' => (int)$completedJobOrders,
        'pendingApprovals' => (int)$pendingApprovals,
        'systemAlerts' => (int)$systemAlerts,
        'totalDevices' => (int)$totalDevices,
        'completedDevices' => (int)$completedDevices,
        'averageEfficiency' => (float)$averageEfficiency
    ];
    
    echo json_encode([
        'success' => true,
        'message' => 'Stats retrieved successfully',
        'data' => $stats
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error retrieving stats: ' . $e->getMessage()
    ]);
}
?>

