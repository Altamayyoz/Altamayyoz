<?php
// Minimal API to list supervisor notifications
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
if ($origin === '*') {
    header('Access-Control-Allow-Origin: *');
} else {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once '../config.php';
    $db = new Database();
    $conn = $db->getConnection();

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    if ($limit <= 0 || $limit > 200) { $limit = 50; }

    $sql = "
        SELECT 
            sn.notification_id AS id,
            sn.job_order_id,
            sn.technician_id,
            sn.task_id,
            sn.notification_type,
            sn.message,
            sn.status,
            sn.created_at,
            t.operation_name,
            t.devices_completed,
            t.actual_time_minutes,
            t.efficiency_percentage,
            u.name AS technician_name
        FROM supervisor_notifications sn
        LEFT JOIN tasks t ON sn.task_id = t.task_id
        LEFT JOIN technicians tech ON sn.technician_id = tech.technician_id
        LEFT JOIN users u ON tech.user_id = u.user_id
        ORDER BY sn.created_at DESC
        LIMIT :limit
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Supervisor notifications loaded',
        'data' => $rows
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
    ]);
} catch (Error $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Fatal error: ' . $e->getMessage(),
    ]);
}
?>

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
    $user_id = 2; // Default to supervisor for testing
    $user_role = 'supervisor';
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
    case 'PUT':
        handlePutRequest();
        break;
    default:
        sendResponse(false, 'Invalid request method');
}

function handleGetRequest() {
    global $user_id, $user_role;
    
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        // Get all notifications for supervisor
        $query = "SELECT 
                    sn.notification_id,
                    sn.job_order_id,
                    sn.technician_id,
                    sn.task_id,
                    sn.notification_type,
                    sn.message,
                    sn.status,
                    sn.created_at,
                    sn.read_at,
                    sn.resolved_at,
                    u.name as technician_name,
                    jo.total_devices,
                    t.operation_name,
                    t.devices_completed,
                    t.actual_time_minutes,
                    t.efficiency_percentage,
                    t.serial_numbers,
                    t.notes
                  FROM supervisor_notifications sn
                  LEFT JOIN users u ON sn.technician_id = u.user_id
                  LEFT JOIN job_orders jo ON sn.job_order_id = jo.job_order_id
                  LEFT JOIN tasks t ON sn.task_id = t.task_id
                  WHERE sn.status IN ('pending', 'read')
                  ORDER BY sn.created_at DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the response
        $formatted_notifications = array_map(function($notification) {
            return [
                'id' => $notification['notification_id'],
                'jobOrderId' => $notification['job_order_id'],
                'technicianId' => $notification['technician_id'],
                'technicianName' => $notification['technician_name'],
                'taskId' => $notification['task_id'],
                'type' => $notification['notification_type'],
                'message' => $notification['message'],
                'status' => $notification['status'],
                'createdAt' => $notification['created_at'],
                'readAt' => $notification['read_at'],
                'resolvedAt' => $notification['resolved_at'],
                'operationName' => $notification['operation_name'],
                'devicesCompleted' => $notification['devices_completed'],
                'actualTimeMinutes' => $notification['actual_time_minutes'],
                'efficiencyPercentage' => $notification['efficiency_percentage'],
                'serialNumbers' => json_decode($notification['serial_numbers'] ?? '[]', true),
                'notes' => $notification['notes'],
                'totalDevices' => $notification['total_devices']
            ];
        }, $notifications);
        
        sendResponse(true, 'Notifications retrieved successfully', $formatted_notifications);
        
    } catch (Exception $e) {
        error_log("Get notifications error: " . $e->getMessage());
        sendResponse(false, 'Failed to retrieve notifications');
    }
}

function handlePutRequest() {
    global $user_id, $user_role;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['notification_id']) || !isset($input['action'])) {
        sendResponse(false, 'Missing required fields: notification_id and action');
        return;
    }
    
    $notification_id = $input['notification_id'];
    $action = $input['action']; // 'read', 'approve', 'reject'
    $comments = $input['comments'] ?? '';
    
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        $conn->beginTransaction();
        
        if ($action === 'read') {
            // Mark notification as read
            $query = "UPDATE supervisor_notifications 
                      SET status = 'read', read_at = NOW() 
                      WHERE notification_id = :notification_id";
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':notification_id', $notification_id);
            $stmt->execute();
            
        } elseif ($action === 'approve' || $action === 'reject') {
            // Get notification details
            $notification_query = "SELECT task_id, technician_id, job_order_id FROM supervisor_notifications WHERE notification_id = :notification_id";
            $notification_stmt = $conn->prepare($notification_query);
            $notification_stmt->bindValue(':notification_id', $notification_id);
            $notification_stmt->execute();
            $notification = $notification_stmt->fetch();
            
            if (!$notification) {
                throw new Exception('Notification not found');
            }
            
            // Update task status
            $task_status = $action === 'approve' ? 'approved' : 'rejected';
            $task_query = "UPDATE tasks SET status = :status WHERE task_id = :task_id";
            $task_stmt = $conn->prepare($task_query);
            $task_stmt->bindValue(':status', $task_status);
            $task_stmt->bindValue(':task_id', $notification['task_id']);
            $task_stmt->execute();
            
            // Update notification status
            $notification_update_query = "UPDATE supervisor_notifications 
                                         SET status = 'resolved', resolved_at = NOW() 
                                         WHERE notification_id = :notification_id";
            $notification_update_stmt = $conn->prepare($notification_update_query);
            $notification_update_stmt->bindValue(':notification_id', $notification_id);
            $notification_update_stmt->execute();
            
            // Insert approval history
            $approval_query = "INSERT INTO approval_history (
                task_id, supervisor_id, technician_id, action_type, comments, approval_date
            ) VALUES (
                :task_id, :supervisor_id, :technician_id, :action_type, :comments, NOW()
            )";
            $approval_stmt = $conn->prepare($approval_query);
            $approval_stmt->bindValue(':task_id', $notification['task_id']);
            $approval_stmt->bindValue(':supervisor_id', $user_id);
            $approval_stmt->bindValue(':technician_id', $notification['technician_id']);
            $approval_stmt->bindValue(':action_type', $action);
            $approval_stmt->bindValue(':comments', $comments);
            $approval_stmt->execute();
            
            // Update job order progress if approved
            if ($action === 'approve') {
                $progress_query = "UPDATE job_orders 
                                  SET progress_percentage = (
                                      SELECT COALESCE(
                                          ROUND((SUM(devices_completed) / total_devices) * 100, 1), 
                                          0
                                      ) 
                                      FROM tasks 
                                      WHERE job_order_id = :job_order_id 
                                      AND status = 'approved'
                                  )
                                  WHERE job_order_id = :job_order_id";
                $progress_stmt = $conn->prepare($progress_query);
                $progress_stmt->bindValue(':job_order_id', $notification['job_order_id']);
                $progress_stmt->execute();
            }
        }
        
        $conn->commit();
        sendResponse(true, 'Notification updated successfully');
        
    } catch (Exception $e) {
        $conn->rollback();
        error_log("Update notification error: " . $e->getMessage());
        sendResponse(false, 'Failed to update notification');
    }
}

function sendResponse($success, $message, $data = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}
?>
