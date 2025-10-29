<?php
// Operations API
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
    // Alias standard_time as standard_time_minutes for frontend consistency
    $query = "SELECT operation_id, operation_name, standard_time as standard_time_minutes, description, category, created_at 
              FROM operations 
              ORDER BY operation_name ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $operations = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'message' => 'Operations retrieved successfully',
        'data' => $operations
    ]);
}
?>

