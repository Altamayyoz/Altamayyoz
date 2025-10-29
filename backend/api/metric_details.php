<?php
// Metric Details API - Detailed breakdown of Efficiency and Productivity
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
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetRequest($conn);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

function handleGetRequest($conn) {
    $metricType = $_GET['type'] ?? 'efficiency'; // 'efficiency' or 'productivity'
    $period = $_GET['period'] ?? '30'; // days
    
    // Get breakdown by operation
    if ($metricType === 'efficiency') {
        $operationQuery = "SELECT 
                            t.operation_name,
                            AVG(t.efficiency_percentage) as avg_value,
                            COUNT(*) as task_count,
                            SUM(t.devices_completed) as total_devices
                          FROM tasks t
                          WHERE t.status = 'approved'
                          AND t.created_at >= DATE_SUB(NOW(), INTERVAL :period DAY)
                          GROUP BY t.operation_name
                          ORDER BY avg_value DESC
                          LIMIT 10";
    } else {
        $operationQuery = "SELECT 
                            t.operation_name,
                            (SUM(t.devices_completed) / SUM(t.actual_time_minutes)) * 60 as avg_value,
                            COUNT(*) as task_count,
                            SUM(t.devices_completed) as total_devices
                          FROM tasks t
                          WHERE t.status = 'approved'
                          AND t.created_at >= DATE_SUB(NOW(), INTERVAL :period DAY)
                          GROUP BY t.operation_name
                          ORDER BY avg_value DESC
                          LIMIT 10";
    }
    
    $operationStmt = $conn->prepare($operationQuery);
    $operationStmt->bindValue(':period', (int)$period, PDO::PARAM_INT);
    $operationStmt->execute();
    $byOperation = $operationStmt->fetchAll();
    
    // Get breakdown by technician
    if ($metricType === 'efficiency') {
        $technicianQuery = "SELECT 
                             u.name as technician_name,
                             AVG(pm.efficiency) as avg_value,
                             COUNT(pm.metric_id) as task_count,
                             SUM(
                               (SELECT SUM(devices_completed) 
                                FROM tasks 
                                WHERE technician_id = tech.technician_id 
                                AND DATE(created_at) = pm.date
                                AND status = 'approved')
                             ) as total_devices
                           FROM performance_metrics pm
                           JOIN technicians tech ON pm.technician_id = tech.technician_id
                           JOIN users u ON tech.user_id = u.user_id
                           WHERE pm.created_at >= DATE_SUB(NOW(), INTERVAL :period DAY)
                           GROUP BY tech.technician_id, u.name
                           ORDER BY avg_value DESC
                           LIMIT 10";
    } else {
        $technicianQuery = "SELECT 
                             u.name as technician_name,
                             AVG(pm.productivity) as avg_value,
                             COUNT(pm.metric_id) as task_count,
                             0 as total_devices
                           FROM performance_metrics pm
                           JOIN technicians tech ON pm.technician_id = tech.technician_id
                           JOIN users u ON tech.user_id = u.user_id
                           WHERE pm.created_at >= DATE_SUB(NOW(), INTERVAL :period DAY)
                           GROUP BY tech.technician_id, u.name
                           ORDER BY avg_value DESC
                           LIMIT 10";
    }
    
    $technicianStmt = $conn->prepare($technicianQuery);
    $technicianStmt->bindValue(':period', (int)$period, PDO::PARAM_INT);
    $technicianStmt->execute();
    $byTechnician = $technicianStmt->fetchAll();
    
    // If no performance_metrics data, calculate from tasks
    if (empty($byTechnician) && $metricType === 'efficiency') {
        $technicianFromTasksQuery = "SELECT 
                                       u.name as technician_name,
                                       AVG(t.efficiency_percentage) as avg_value,
                                       COUNT(*) as task_count,
                                       SUM(t.devices_completed) as total_devices
                                     FROM tasks t
                                     JOIN technicians tech ON t.technician_id = tech.technician_id
                                     JOIN users u ON tech.user_id = u.user_id
                                     WHERE t.status = 'approved'
                                     AND t.created_at >= DATE_SUB(NOW(), INTERVAL :period DAY)
                                     GROUP BY tech.technician_id, u.name
                                     ORDER BY avg_value DESC
                                     LIMIT 10";
        
        $technicianFromTasksStmt = $conn->prepare($technicianFromTasksQuery);
        $technicianFromTasksStmt->bindValue(':period', (int)$period, PDO::PARAM_INT);
        $technicianFromTasksStmt->execute();
        $byTechnician = $technicianFromTasksStmt->fetchAll();
    } elseif (empty($byTechnician) && $metricType === 'productivity') {
        $technicianFromTasksQuery = "SELECT 
                                       u.name as technician_name,
                                       (SUM(t.devices_completed) / SUM(t.actual_time_minutes)) * 60 as avg_value,
                                       COUNT(*) as task_count,
                                       SUM(t.devices_completed) as total_devices
                                     FROM tasks t
                                     JOIN technicians tech ON t.technician_id = tech.technician_id
                                     JOIN users u ON tech.user_id = u.user_id
                                     WHERE t.status = 'approved'
                                     AND t.created_at >= DATE_SUB(NOW(), INTERVAL :period DAY)
                                     GROUP BY tech.technician_id, u.name
                                     ORDER BY avg_value DESC
                                     LIMIT 10";
        
        $technicianFromTasksStmt = $conn->prepare($technicianFromTasksQuery);
        $technicianFromTasksStmt->bindValue(':period', (int)$period, PDO::PARAM_INT);
        $technicianFromTasksStmt->execute();
        $byTechnician = $technicianFromTasksStmt->fetchAll();
    }
    
    // Get weekly trend (last 7 days)
    if ($metricType === 'efficiency') {
        $weeklyQuery = "SELECT 
                         DATE(created_at) as date,
                         AVG(efficiency) as value
                       FROM performance_metrics
                       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                       GROUP BY DATE(created_at)
                       ORDER BY date ASC";
    } else {
        $weeklyQuery = "SELECT 
                         DATE(created_at) as date,
                         AVG(productivity) as value
                       FROM performance_metrics
                       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                       GROUP BY DATE(created_at)
                       ORDER BY date ASC";
    }
    
    $weeklyStmt = $conn->prepare($weeklyQuery);
    $weeklyStmt->execute();
    $weeklyTrend = $weeklyStmt->fetchAll();
    
    // If no performance_metrics data, calculate from tasks
    if (empty($weeklyTrend) && $metricType === 'efficiency') {
        $weeklyFromTasksQuery = "SELECT 
                                   DATE(created_at) as date,
                                   AVG(efficiency_percentage) as value
                                 FROM tasks
                                 WHERE status = 'approved'
                                 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                                 GROUP BY DATE(created_at)
                                 ORDER BY date ASC";
        $weeklyFromTasksStmt = $conn->prepare($weeklyFromTasksQuery);
        $weeklyFromTasksStmt->execute();
        $weeklyTrend = $weeklyFromTasksStmt->fetchAll();
    } elseif (empty($weeklyTrend) && $metricType === 'productivity') {
        $weeklyFromTasksQuery = "SELECT 
                                   DATE(created_at) as date,
                                   (SUM(devices_completed) / SUM(actual_time_minutes)) * 60 as value
                                 FROM tasks
                                 WHERE status = 'approved'
                                 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                                 GROUP BY DATE(created_at)
                                 ORDER BY date ASC";
        $weeklyFromTasksStmt = $conn->prepare($weeklyFromTasksQuery);
        $weeklyFromTasksStmt->execute();
        $weeklyTrend = $weeklyFromTasksStmt->fetchAll();
    }
    
    // Get comparison values (last week, last month, target)
    if ($metricType === 'efficiency') {
        $currentQuery = "SELECT AVG(efficiency) as current_value FROM performance_metrics WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else {
        $currentQuery = "SELECT AVG(productivity) as current_value FROM performance_metrics WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    }
    
    $currentStmt = $conn->prepare($currentQuery);
    $currentStmt->execute();
    $current = $currentStmt->fetch();
    $currentValue = $current ? (float)$current['current_value'] : 0;
    
    if (!$currentValue || $currentValue == 0) {
        // Calculate from tasks
        if ($metricType === 'efficiency') {
            $currentFromTasksQuery = "SELECT AVG(efficiency_percentage) as current_value FROM tasks WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } else {
            $currentFromTasksQuery = "SELECT (SUM(devices_completed) / SUM(actual_time_minutes)) * 60 as current_value FROM tasks WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        }
        $currentFromTasksStmt = $conn->prepare($currentFromTasksQuery);
        $currentFromTasksStmt->execute();
        $currentFromTasks = $currentFromTasksStmt->fetch();
        $currentValue = $currentFromTasks ? (float)$currentFromTasks['current_value'] : 0;
    }
    
    // Get last week average
    if ($metricType === 'efficiency') {
        $lastWeekQuery = "SELECT AVG(efficiency) as last_week_value FROM performance_metrics WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else {
        $lastWeekQuery = "SELECT AVG(productivity) as last_week_value FROM performance_metrics WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)";
    }
    
    $lastWeekStmt = $conn->prepare($lastWeekQuery);
    $lastWeekStmt->execute();
    $lastWeek = $lastWeekStmt->fetch();
    $lastWeekValue = $lastWeek ? (float)$lastWeek['last_week_value'] : ($currentValue + ($currentValue * 0.05));
    
    if (!$lastWeekValue || $lastWeekValue == 0) {
        // Calculate from tasks
        if ($metricType === 'efficiency') {
            $lastWeekFromTasksQuery = "SELECT AVG(efficiency_percentage) as last_week_value FROM tasks WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } else {
            $lastWeekFromTasksQuery = "SELECT (SUM(devices_completed) / SUM(actual_time_minutes)) * 60 as last_week_value FROM tasks WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)";
        }
        $lastWeekFromTasksStmt = $conn->prepare($lastWeekFromTasksQuery);
        $lastWeekFromTasksStmt->execute();
        $lastWeekFromTasks = $lastWeekFromTasksStmt->fetch();
        $lastWeekValue = $lastWeekFromTasks ? (float)$lastWeekFromTasks['last_week_value'] : ($currentValue + ($currentValue * 0.05));
    }
    
    // Get last month average
    if ($metricType === 'efficiency') {
        $lastMonthQuery = "SELECT AVG(efficiency) as last_month_value FROM performance_metrics WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)";
    } else {
        $lastMonthQuery = "SELECT AVG(productivity) as last_month_value FROM performance_metrics WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }
    
    $lastMonthStmt = $conn->prepare($lastMonthQuery);
    $lastMonthStmt->execute();
    $lastMonth = $lastMonthStmt->fetch();
    $lastMonthValue = $lastMonth ? (float)$lastMonth['last_month_value'] : ($currentValue - ($currentValue * 0.1));
    
    if (!$lastMonthValue || $lastMonthValue == 0) {
        // Calculate from tasks
        if ($metricType === 'efficiency') {
            $lastMonthFromTasksQuery = "SELECT AVG(efficiency_percentage) as last_month_value FROM tasks WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)";
        } else {
            $lastMonthFromTasksQuery = "SELECT (SUM(devices_completed) / SUM(actual_time_minutes)) * 60 as last_month_value FROM tasks WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)";
        }
        $lastMonthFromTasksStmt = $conn->prepare($lastMonthFromTasksQuery);
        $lastMonthFromTasksStmt->execute();
        $lastMonthFromTasks = $lastMonthFromTasksStmt->fetch();
        $lastMonthValue = $lastMonthFromTasks ? (float)$lastMonthFromTasks['last_month_value'] : ($currentValue - ($currentValue * 0.1));
    }
    
    // Target values (standard targets)
    $targetValue = $metricType === 'efficiency' ? 85.0 : 8.5;
    
    echo json_encode([
        'success' => true,
        'message' => 'Metric details retrieved successfully',
        'data' => [
            'byOperation' => array_map(function($item) use ($metricType) {
                return [
                    'operation_name' => $item['operation_name'],
                    'avg_value' => round((float)$item['avg_value'], $metricType === 'efficiency' ? 1 : 2),
                    'task_count' => (int)$item['task_count'],
                    'total_devices' => (int)($item['total_devices'] ?? 0)
                ];
            }, $byOperation),
            'byTechnician' => array_map(function($item) use ($metricType) {
                return [
                    'technician_name' => $item['technician_name'],
                    'avg_value' => round((float)$item['avg_value'], $metricType === 'efficiency' ? 1 : 2),
                    'task_count' => (int)$item['task_count'],
                    'total_devices' => (int)($item['total_devices'] ?? 0)
                ];
            }, $byTechnician),
            'weeklyTrend' => array_map(function($item) {
                return [
                    'week' => date('D', strtotime($item['date'])),
                    'date' => $item['date'],
                    'value' => round((float)$item['value'], 1)
                ];
            }, $weeklyTrend),
            'comparison' => [
                'lastWeek' => round($lastWeekValue, $metricType === 'efficiency' ? 1 : 2),
                'lastMonth' => round($lastMonthValue, $metricType === 'efficiency' ? 1 : 2),
                'target' => $targetValue
            ]
        ]
    ]);
}
?>

