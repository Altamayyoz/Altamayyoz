<?php
// Admin Alerts API
require_once '../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
        case 'POST':
            handlePostRequest($conn);
            break;
        case 'PUT':
            handlePutRequest($conn);
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
    $resolved = $_GET['resolved'] ?? null;
    
    $query = "SELECT a.*, u.name as technician_name 
              FROM alerts a
              LEFT JOIN technicians t ON a.technician_id = t.technician_id
              LEFT JOIN users u ON t.user_id = u.user_id
              WHERE 1=1";
    
    $params = [];
    
    if ($resolved !== null) {
        $query .= " AND a.read_status = :resolved";
        $params[':resolved'] = $resolved === 'true' ? 1 : 0;
    }
    
    $query .= " ORDER BY a.created_at DESC LIMIT 50";
    
    $stmt = $conn->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    $alerts = $stmt->fetchAll();
    
    // Map backend alerts to frontend format
    $mappedAlerts = array_map(function($alert) {
        // Map severity: info -> Low, warning -> Medium, critical -> Critical
        $severityMap = [
            'info' => 'Low',
            'warning' => 'Medium',
            'critical' => 'Critical'
        ];
        
        $severity = $severityMap[strtolower($alert['severity'])] ?? 'Low';
        
        return [
            'id' => (string)$alert['alert_id'],
            'type' => $alert['alert_type'],
            'severity' => $severity,
            'message' => $alert['message'],
            'timestamp' => $alert['created_at'],
            'resolved' => (bool)$alert['read_status'],
            'technicianName' => $alert['technician_name'] ?? 'System'
        ];
    }, $alerts);
    
    echo json_encode([
        'success' => true,
        'message' => 'Alerts retrieved successfully',
        'data' => $mappedAlerts
    ]);
}

function handlePostRequest($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['alert_type', 'message', 'severity'];
    $errors = [];
    
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            $errors[] = "$field is required";
        }
    }
    
    if (!empty($errors)) {
        echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
        return;
    }
    
    $query = "INSERT INTO alerts (technician_id, alert_type, message, severity, date, read_status) 
              VALUES (:technician_id, :alert_type, :message, :severity, CURDATE(), FALSE)";
    
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':technician_id', $input['technician_id'] ?? null, PDO::PARAM_INT);
    $stmt->bindValue(':alert_type', $input['alert_type']);
    $stmt->bindValue(':message', $input['message']);
    $stmt->bindValue(':severity', strtolower($input['severity'])); // critical -> critical, Critical -> critical
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Alert created successfully',
            'data' => ['alert_id' => $conn->lastInsertId()]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create alert']);
    }
}

function handlePutRequest($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['alert_id'])) {
        echo json_encode(['success' => false, 'message' => 'alert_id is required']);
        return;
    }
    
    $alertId = $input['alert_id'];
    $readStatus = isset($input['resolved']) ? ($input['resolved'] ? 1 : 0) : null;
    
    if ($readStatus === null) {
        echo json_encode(['success' => false, 'message' => 'resolved status is required']);
        return;
    }
    
    $query = "UPDATE alerts SET read_status = :read_status WHERE alert_id = :alert_id";
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':read_status', $readStatus);
    $stmt->bindValue(':alert_id', $alertId);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Alert updated successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update alert']);
    }
}

function handleDeleteRequest($conn) {
    $alertId = $_GET['alert_id'] ?? null;
    
    if (!$alertId) {
        echo json_encode(['success' => false, 'message' => 'alert_id is required']);
        return;
    }
    
    $query = "DELETE FROM alerts WHERE alert_id = :alert_id";
    $stmt = $conn->prepare($query);
    $stmt->bindValue(':alert_id', $alertId);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Alert deleted successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete alert']);
    }
}
?>

