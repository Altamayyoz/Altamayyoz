<?php
// Disable error display to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set proper headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once '../config.php';

    // Temporary fix: Skip authentication for testing
    // TODO: Implement proper API authentication
    $user_id = 1; // Default to admin for testing
    $user_role = 'engineer';
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Initialization error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
} catch (Error $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Fatal error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
}

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRequest();
        break;
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Method not implemented yet'
        ]);
}

function handleGetRequest() {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        // Get devices with related information
        $query = "SELECT d.*, t.technician_id, u.name as technician_name, 
                         jo.job_order_id, task.operation_name, task.date as completion_date
                  FROM device_serial_numbers d
                  LEFT JOIN tasks task ON d.task_id = task.task_id
                  LEFT JOIN technicians t ON task.technician_id = t.technician_id
                  LEFT JOIN users u ON t.user_id = u.user_id
                  LEFT JOIN job_orders jo ON task.job_order_id = jo.job_order_id
                  ORDER BY d.device_id DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        $devices = $stmt->fetchAll();
        
        // Add status based on completion
        foreach ($devices as &$device) {
            $device['status'] = $device['completion_date'] ? 'completed' : 'in_progress';
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Devices retrieved successfully',
            'data' => $devices
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error retrieving devices: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    } catch (Error $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error retrieving devices: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    }
}
?>
