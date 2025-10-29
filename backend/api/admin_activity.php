<?php
// Admin Activity Logs API
require_once '../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS');
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
        case 'DELETE':
            handleDeleteRequest($conn);
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
    
    $query = "SELECT al.*, u.name as user_name, u.username 
              FROM activity_log al
              LEFT JOIN users u ON al.user_id = u.user_id
              ORDER BY al.created_at DESC
              LIMIT :limit";
    
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $activities = $stmt->fetchAll();
    
    // Map to frontend format
    $mappedActivities = array_map(function($activity) {
        // Determine activity type from action
        $type = 'system';
        if (strpos(strtolower($activity['action']), 'user') !== false) {
            $type = 'user';
        } elseif (strpos(strtolower($activity['action']), 'job') !== false || strpos(strtolower($activity['action']), 'order') !== false) {
            $type = 'job';
        } elseif (strpos(strtolower($activity['action']), 'alert') !== false) {
            $type = 'alert';
        } elseif (strpos(strtolower($activity['action']), 'export') !== false || strpos(strtolower($activity['action']), 'report') !== false) {
            $type = 'report';
        }
        
        return [
            'action' => $activity['action'],
            'user' => $activity['user_name'] ?? $activity['username'] ?? 'System',
            'time' => $activity['created_at'],
            'type' => $type,
            'details' => $activity['details']
        ];
    }, $activities);
    
    echo json_encode([
        'success' => true,
        'message' => 'Activity logs retrieved successfully',
        'data' => $mappedActivities
    ]);
}

function handleDeleteRequest($conn) {
    $days = isset($_GET['days']) ? (int)$_GET['days'] : 90;
    
    if ($days < 1) {
        echo json_encode(['success' => false, 'message' => 'Days must be at least 1']);
        return;
    }
    
    $query = "DELETE FROM activity_log WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':days', $days, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        $deletedCount = $stmt->rowCount();
        echo json_encode([
            'success' => true,
            'message' => "Cleared logs older than $days days",
            'data' => ['deleted_count' => $deletedCount]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to clear logs']);
    }
}
?>

