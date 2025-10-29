<?php
// Planning Engineer Activities API for Admin Dashboard
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
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $user_role = isset($_GET['role']) ? $_GET['role'] : 'engineer'; // Filter by Planning Engineer role
    
    // Get Planning Engineer activities
    $query = "SELECT al.*, u.name as user_name, u.username, u.role 
              FROM activity_log al
              LEFT JOIN users u ON al.user_id = u.user_id
              WHERE u.role = 'engineer' OR al.action LIKE '%job_order%' OR al.action LIKE '%planning%'
              ORDER BY al.created_at DESC
              LIMIT :limit";
    
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $activities = $stmt->fetchAll();
    
    // Get job orders created by Planning Engineer
    $job_orders_query = "SELECT job_order_id, total_devices, due_date, created_date, status 
                        FROM job_orders 
                        ORDER BY created_date DESC 
                        LIMIT :limit";
    $job_stmt = $conn->prepare($job_orders_query);
    $job_stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $job_stmt->execute();
    $job_orders = $job_stmt->fetchAll();
    
    // Map activities to frontend format
    $mappedActivities = array_map(function($activity) {
        // Determine activity type and icon
        $type = 'system';
        $icon = '📋';
        
        if (strpos(strtolower($activity['action']), 'create_job_order') !== false) {
            $type = 'job';
            $icon = '📝';
        } elseif (strpos(strtolower($activity['action']), 'update_job_order') !== false) {
            $type = 'job';
            $icon = '✏️';
        } elseif (strpos(strtolower($activity['action']), 'alert') !== false) {
            $type = 'alert';
            $icon = '🔔';
        } elseif (strpos(strtolower($activity['action']), 'report') !== false) {
            $type = 'report';
            $icon = '📊';
        }
        
        return [
            'id' => $activity['log_id'],
            'action' => $activity['action'],
            'user' => $activity['user_name'] ?? $activity['username'] ?? 'Planning Engineer',
            'time' => $activity['created_at'],
            'type' => $type,
            'icon' => $icon,
            'details' => $activity['details'] ?? '',
            'userRole' => $activity['role'] ?? 'engineer'
        ];
    }, $activities);
    
    echo json_encode([
        'success' => true,
        'message' => 'Planning Engineer activities retrieved successfully',
        'data' => [
            'activities' => $mappedActivities,
            'recentJobOrders' => $job_orders,
            'summary' => [
                'totalActivities' => count($mappedActivities),
                'recentJobOrdersCreated' => count($job_orders),
                'pendingJobOrders' => count(array_filter($job_orders, function($jo) { return $jo['status'] === 'active'; }))
            ]
        ]
    ]);
}
?>

