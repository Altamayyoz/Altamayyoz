<?php
// Set CORS headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

// Check authentication
session_start();
if (!isset($_SESSION['user_id'])) {
    sendResponse(false, 'Authentication required');
}

$user_id = $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? '';

// Only supervisors can approve/reject tasks
if ($user_role !== 'supervisor') {
    sendResponse(false, 'Access denied. Supervisor role required.');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendResponse(false, 'Invalid JSON input');
    }
    
    $task_id = $input['task_id'] ?? null;
    $action = $input['action'] ?? null; // 'approve' or 'reject'
    $comments = $input['comments'] ?? '';
    
    if (!$task_id || !$action) {
        sendResponse(false, 'Task ID and action are required');
    }
    
    if (!in_array($action, ['approve', 'reject'])) {
        sendResponse(false, 'Invalid action. Must be approve or reject.');
    }
    
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            sendResponse(false, 'Database connection failed');
        }
        
        // Start transaction
        $conn->beginTransaction();
        
        // Check if task exists and is pending
        $task_query = "SELECT * FROM tasks WHERE task_id = :task_id AND status = 'pending'";
        $task_stmt = $conn->prepare($task_query);
        $task_stmt->bindValue(':task_id', $task_id);
        $task_stmt->execute();
        $task = $task_stmt->fetch();
        
        if (!$task) {
            throw new Exception('Task not found or already processed');
        }
        
        // Update task status
        $new_status = $action === 'approve' ? 'approved' : 'rejected';
        $update_query = "UPDATE tasks SET status = :status, updated_at = NOW() WHERE task_id = :task_id";
        $update_stmt = $conn->prepare($update_query);
        $update_stmt->bindValue(':status', $new_status);
        $update_stmt->bindValue(':task_id', $task_id);
        $update_stmt->execute();
        
        // Record approval history
        $history_query = "INSERT INTO approval_history (
            task_id, 
            supervisor_id, 
            technician_id, 
            action_type, 
            comments, 
            approval_date
        ) VALUES (
            :task_id, 
            :supervisor_id, 
            :technician_id, 
            :action_type, 
            :comments, 
            NOW()
        )";
        
        $history_stmt = $conn->prepare($history_query);
        $history_stmt->bindValue(':task_id', $task_id);
        $history_stmt->bindValue(':supervisor_id', $user_id);
        $history_stmt->bindValue(':technician_id', $task['technician_id']);
        $history_stmt->bindValue(':action_type', $action);
        $history_stmt->bindValue(':comments', $comments);
        $history_stmt->execute();
        
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
            $progress_stmt->bindValue(':job_order_id', $task['job_order_id']);
            $progress_stmt->execute();
        }
        
        // Update supervisor notification status
        $notification_query = "UPDATE supervisor_notifications 
                              SET status = 'read' 
                              WHERE task_id = :task_id AND status = 'pending'";
        $notification_stmt = $conn->prepare($notification_query);
        $notification_stmt->bindValue(':task_id', $task_id);
        $notification_stmt->execute();
        
        // Commit transaction
        $conn->commit();
        
        sendResponse(true, "Task {$action}d successfully", [
            'task_id' => $task_id,
            'status' => $new_status,
            'action' => $action
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction
        $conn->rollback();
        error_log("Task approval error: " . $e->getMessage());
        sendResponse(false, 'Error processing task approval: ' . $e->getMessage());
    }
} else {
    sendResponse(false, 'Invalid request method');
}
?>
