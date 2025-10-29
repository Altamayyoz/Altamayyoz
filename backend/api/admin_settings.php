<?php
// Admin Settings API
require_once '../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
    
    // Check if settings table exists, create if not
    $checkTableQuery = "SHOW TABLES LIKE 'system_settings'";
    $checkStmt = $conn->prepare($checkTableQuery);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        $createTableQuery = "CREATE TABLE system_settings (
            setting_id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        $conn->exec($createTableQuery);
    }
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetRequest($conn);
            break;
        case 'POST':
        case 'PUT':
            handleSaveRequest($conn);
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
    $query = "SELECT setting_key, setting_value FROM system_settings";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $settings = $stmt->fetchAll();
    
    // Convert to associative array
    $settingsMap = [];
    foreach ($settings as $setting) {
        $settingsMap[$setting['setting_key']] = $setting['setting_value'];
    }
    
    // Set defaults if not exists
    $defaults = [
        'standard_work_hours' => '8',
        'alert_threshold_efficiency' => '70'
    ];
    
    $result = array_merge($defaults, $settingsMap);
    
    echo json_encode([
        'success' => true,
        'message' => 'Settings retrieved successfully',
        'data' => $result
    ]);
}

function handleSaveRequest($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !is_array($input)) {
        echo json_encode(['success' => false, 'message' => 'Invalid settings data']);
        return;
    }
    
    $conn->beginTransaction();
    
    try {
        foreach ($input as $key => $value) {
            $query = "INSERT INTO system_settings (setting_key, setting_value) 
                     VALUES (:key, :value)
                     ON DUPLICATE KEY UPDATE setting_value = :value, updated_at = NOW()";
            
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':key', $key);
            $stmt->bindValue(':value', $value);
            $stmt->execute();
        }
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Settings saved successfully'
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save settings: ' . $e->getMessage()
        ]);
    }
}
?>

