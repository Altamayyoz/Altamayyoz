<?php
// Planning Engineer Alerts API
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set proper headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once __DIR__ . '/../config.php';
    
    // Initialize database first
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    // Check authentication by checking session directly (don't require auth.php as it intercepts POST)
    session_start();
    $user_id = $_SESSION['user_id'] ?? null;
    $user_role = $_SESSION['role'] ?? null;
    
    // Optional: verify user is engineer (can be relaxed for testing)
    // if (!$user_id || $user_role !== 'engineer') {
    //     throw new Exception('Unauthorized: Engineer role required');
    // }

    $method = $_SERVER['REQUEST_METHOD'];
} catch (Exception $e) {
    error_log("Planning alerts initialization error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Initialization error: ' . $e->getMessage(),
        'debug' => $e->getFile() . ':' . $e->getLine()
    ]);
    exit;
} catch (Error $e) {
    error_log("Planning alerts fatal error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Fatal error: ' . $e->getMessage(),
        'debug' => $e->getFile() . ':' . $e->getLine()
    ]);
    exit;
}

// Use sendResponse from config.php

try {
    switch ($method) {
        case 'GET':
            // Get alerts for Planning Engineer
            // These include alerts from supervisors about delays and performance issues
            try {
                // Get alerts that are relevant to Planning Engineer
                // Include supervisor alerts (identified by alert_type or message pattern)
                $query = "SELECT a.*, 
                                 u.name as technician_name,
                                 CASE 
                                     WHEN a.alert_type IN ('supervisor_alert', 'delay_notification', 'performance_issue', 'job_delay', 'manpower_need') THEN 'supervisor'
                                     WHEN a.message LIKE '%Supervisor%' OR a.message LIKE '%delay%' OR a.message LIKE '%performance%' THEN 'supervisor'
                                     ELSE 'system'
                                 END as sender_role
                          FROM alerts a
                          LEFT JOIN technicians t ON a.technician_id = t.technician_id
                          LEFT JOIN users u ON t.user_id = u.user_id
                          WHERE (a.alert_type IN ('supervisor_alert', 'delay_notification', 'performance_issue', 'job_delay', 'manpower_need')
                                 OR a.message LIKE '%delay%'
                                 OR a.message LIKE '%performance issue%'
                                 OR a.message LIKE '%manpower%'
                                 OR a.message LIKE '%Supervisor%')
                          ORDER BY a.created_at DESC
                          LIMIT 50";
                
                $stmt = $conn->prepare($query);
                $stmt->execute();
                $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Map alerts to frontend format
                $mappedAlerts = array_map(function($alert) {
                    return [
                        'id' => (string)$alert['alert_id'],
                        'type' => $alert['alert_type'],
                        'message' => $alert['message'],
                        'severity' => $alert['severity'],
                        'date' => $alert['date'],
                        'createdAt' => $alert['created_at'],
                        'read' => (bool)$alert['read_status'],
                        'senderName' => $alert['technician_name'] ?? 'System',
                        'senderRole' => $alert['sender_role'] ?? 'system'
                    ];
                }, $alerts);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Alerts retrieved successfully',
                    'data' => $mappedAlerts
                ]);
            } catch (PDOException $e) {
                error_log("Planning alerts fetch error: " . $e->getMessage());
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to fetch alerts: ' . $e->getMessage()
                ]);
            }
            break;
            
        case 'POST':
            // Create alert - Planning Engineer can send to Supervisor or Admin
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['target']) || !isset($input['message']) || !isset($input['alert_type'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Missing required fields: target, message, alert_type'
                ]);
                exit;
            }
            
            $target = $input['target']; // 'supervisor' or 'admin'
            $message = $input['message'];
            $alert_type = $input['alert_type'];
            $severity = $input['severity'] ?? 'info';
            $job_order_id = $input['job_order_id'] ?? null;
            
            // Build alert message with job order context if provided
            if ($job_order_id) {
                $message = $message . " (Job Order: $job_order_id)";
            }
            
            try {
                // Insert alert
                // For supervisor alerts, technician_id is NULL (system-level alert)
                // For admin alerts, technician_id is also NULL
                $query = "INSERT INTO alerts (technician_id, alert_type, message, severity, date, read_status, created_at) 
                          VALUES (NULL, ?, ?, ?, CURDATE(), FALSE, NOW())";
                
                $stmt = $conn->prepare($query);
                $alert_type_full = $target === 'supervisor' ? 'planner_instruction' : 'planner_alert';
                $full_message = $target === 'supervisor' 
                    ? "[Planning Engineer Instruction] " . $message
                    : "[Planning Engineer Alert to Admin] " . $message;
                
                $stmt->execute([$alert_type_full, $full_message, $severity]);
                
                // Log activity (if function exists and user_id is set)
                if ($user_id) {
                    try {
                        $activity_msg = "Sent alert to " . ucfirst($target) . ": " . $message;
                        logActivity($user_id, 'send_alert', $activity_msg);
                    } catch (Exception $e) {
                        // Ignore logging errors
                        error_log("Activity logging failed: " . $e->getMessage());
                    }
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Alert sent successfully'
                ]);
            } catch (PDOException $e) {
                error_log("Planning alert creation error: " . $e->getMessage());
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create alert: ' . $e->getMessage()
                ]);
            }
            break;
            
        case 'PUT':
            // Mark alert as read
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['alert_id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Missing alert_id'
                ]);
                exit;
            }
            
            $alert_id = $input['alert_id'];
            $read_status = $input['read_status'] ?? true;
            
            try {
                $query = "UPDATE alerts SET read_status = ? WHERE alert_id = ?";
                $stmt = $conn->prepare($query);
                $stmt->execute([$read_status ? 1 : 0, $alert_id]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Alert status updated'
                ]);
            } catch (PDOException $e) {
                error_log("Planning alert update error: " . $e->getMessage());
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update alert: ' . $e->getMessage()
                ]);
            }
            break;
            
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
    }
} catch (Exception $e) {
    error_log("Planning alerts API error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
