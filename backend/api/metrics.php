<?php
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
    default:
        sendResponse(false, 'Invalid request method');
}

function handleGetRequest() {
    global $user_id, $user_role;
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $technician_id = $_GET['technician_id'] ?? null;
    $date = $_GET['date'] ?? null;
    $period = $_GET['period'] ?? 'daily';
    $team = isset($_GET['team']) && $_GET['team'] === 'true';
    
    if ($team && $user_role === 'engineer') {
        // Get team metrics
        getTeamMetrics($conn, $date);
    } else {
        // Get individual metrics
        getIndividualMetrics($conn, $technician_id, $date, $period);
    }
}

function getIndividualMetrics($conn, $technician_id, $date, $period) {
    global $user_id, $user_role;
    
    // If technician_id not provided, use current user
    if (!$technician_id && $user_role === 'technician') {
        $technician_id = $user_id;
    }
    
    if (!$technician_id) {
        sendResponse(false, 'Technician ID required');
    }
    
    // Check if user can access these metrics
    if ($user_role === 'technician' && $technician_id != $user_id) {
        sendResponse(false, 'Access denied');
    }
    
    $query = "SELECT * FROM performance_metrics WHERE technician_id = :technician_id";
    $params = [':technician_id' => $technician_id];
    
    if ($date) {
        $query .= " AND date = :date";
        $params[':date'] = $date;
    }
    
    switch ($period) {
        case 'weekly':
            $query .= " AND date >= DATE_SUB(:date, INTERVAL 7 DAY) ORDER BY date DESC";
            break;
        case 'monthly':
            $query .= " AND date >= DATE_SUB(:date, INTERVAL 30 DAY) ORDER BY date DESC";
            break;
        default:
            $query .= " ORDER BY date DESC LIMIT 30";
    }
    
    $stmt = $conn->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    $metrics = $stmt->fetchAll();
    
    // Get technician info
    $tech_query = "SELECT u.name, t.station_assigned FROM users u 
                   LEFT JOIN technicians t ON u.user_id = t.user_id 
                   WHERE u.user_id = :technician_id";
    $tech_stmt = $conn->prepare($tech_query);
    $tech_stmt->bindParam(':technician_id', $technician_id);
    $tech_stmt->execute();
    $technician_info = $tech_stmt->fetch();
    
    $result = [
        'technician_info' => $technician_info,
        'metrics' => $metrics,
        'summary' => calculateSummary($metrics)
    ];
    
    sendResponse(true, 'Metrics retrieved successfully', $result);
}

function getTeamMetrics($conn, $date) {
    $query = "SELECT pm.*, u.name as technician_name, t.station_assigned 
              FROM performance_metrics pm
              LEFT JOIN users u ON pm.technician_id = u.user_id
              LEFT JOIN technicians t ON pm.technician_id = t.user_id";
    
    $params = [];
    
    if ($date) {
        $query .= " WHERE pm.date = :date";
        $params[':date'] = $date;
    }
    
    $query .= " ORDER BY pm.date DESC, u.name ASC";
    
    $stmt = $conn->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    $metrics = $stmt->fetchAll();
    
    // Calculate team summary
    $team_summary = calculateTeamSummary($metrics);
    
    $result = [
        'team_metrics' => $metrics,
        'team_summary' => $team_summary
    ];
    
    sendResponse(true, 'Team metrics retrieved successfully', $result);
}

function calculateSummary($metrics) {
    if (empty($metrics)) {
        return [
            'avg_productivity' => 0,
            'avg_efficiency' => 0,
            'avg_utilization' => 0,
            'total_tasks' => 0,
            'best_day' => null,
            'worst_day' => null
        ];
    }
    
    $productivity_sum = array_sum(array_column($metrics, 'productivity'));
    $efficiency_sum = array_sum(array_column($metrics, 'efficiency'));
    $utilization_sum = array_sum(array_column($metrics, 'utilization'));
    $count = count($metrics);
    
    // Find best and worst days
    $best_day = null;
    $worst_day = null;
    $best_score = 0;
    $worst_score = 100;
    
    foreach ($metrics as $metric) {
        $score = ($metric['efficiency'] + $metric['utilization']) / 2;
        
        if ($score > $best_score) {
            $best_score = $score;
            $best_day = $metric;
        }
        
        if ($score < $worst_score) {
            $worst_score = $score;
            $worst_day = $metric;
        }
    }
    
    return [
        'avg_productivity' => round($productivity_sum / $count, 2),
        'avg_efficiency' => round($efficiency_sum / $count, 1),
        'avg_utilization' => round($utilization_sum / $count, 1),
        'total_tasks' => $count,
        'best_day' => $best_day,
        'worst_day' => $worst_day
    ];
}

function calculateTeamSummary($metrics) {
    if (empty($metrics)) {
        return [
            'total_technicians' => 0,
            'avg_efficiency' => 0,
            'avg_utilization' => 0,
            'top_performer' => null,
            'needs_attention' => []
        ];
    }
    
    $technician_stats = [];
    
    // Group metrics by technician
    foreach ($metrics as $metric) {
        $tech_id = $metric['technician_id'];
        
        if (!isset($technician_stats[$tech_id])) {
            $technician_stats[$tech_id] = [
                'name' => $metric['technician_name'],
                'station' => $metric['station_assigned'],
                'efficiency_sum' => 0,
                'utilization_sum' => 0,
                'count' => 0
            ];
        }
        
        $technician_stats[$tech_id]['efficiency_sum'] += $metric['efficiency'];
        $technician_stats[$tech_id]['utilization_sum'] += $metric['utilization'];
        $technician_stats[$tech_id]['count']++;
    }
    
    // Calculate averages and find top performer
    $top_performer = null;
    $needs_attention = [];
    $total_efficiency = 0;
    $total_utilization = 0;
    
    foreach ($technician_stats as $tech_id => $stats) {
        $avg_efficiency = $stats['efficiency_sum'] / $stats['count'];
        $avg_utilization = $stats['utilization_sum'] / $stats['count'];
        
        $total_efficiency += $avg_efficiency;
        $total_utilization += $avg_utilization;
        
        $stats['avg_efficiency'] = round($avg_efficiency, 1);
        $stats['avg_utilization'] = round($avg_utilization, 1);
        
        // Find top performer
        if (!$top_performer || $avg_efficiency > $top_performer['avg_efficiency']) {
            $top_performer = $stats;
            $top_performer['technician_id'] = $tech_id;
        }
        
        // Find technicians needing attention
        if ($avg_efficiency < 80 || $avg_utilization < 60) {
            $needs_attention[] = $stats;
        }
        
        $technician_stats[$tech_id] = $stats;
    }
    
    $technician_count = count($technician_stats);
    
    return [
        'total_technicians' => $technician_count,
        'avg_efficiency' => round($total_efficiency / $technician_count, 1),
        'avg_utilization' => round($total_utilization / $technician_count, 1),
        'top_performer' => $top_performer,
        'needs_attention' => $needs_attention,
        'technician_stats' => $technician_stats
    ];
}
?>