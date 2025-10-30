<?php
// Disable error display to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start session FIRST before any headers or output
session_start();

// Set proper headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once '../config.php';

    // Get user information from session
    $user_id = $_SESSION['user_id'] ?? null;
    $user_role = $_SESSION['role'] ?? null;

    if (!$user_id) {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required'
        ]);
        exit;
    }

    // Check if user is quality engineer
    // For now, allow any logged-in user (can be restricted later)
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Initialization error: ' . $e->getMessage()
    ]);
    exit;
}

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRequest();
        break;
    case 'POST':
        handlePostRequest();
        break;
    default:
        sendResponse(false, 'Invalid request method');
}

function handleGetRequest() {
    try {
        $status = $_GET['status'] ?? 'pending';
        
        $db = new Database();
        $conn = $db->getConnection();
        
        $query = "SELECT qa.*, jo.product_model as job_order_title, jo.total_devices as total_devices, 
                         jo.status as job_status, u.name as submitted_by_name,
                         (SELECT COUNT(*) FROM tasks t WHERE t.job_order_id = qa.job_order_id AND t.status = 'approved') as completed_devices
                  FROM quality_approvals qa
                  LEFT JOIN job_orders jo ON qa.job_order_id = jo.job_order_id
                  LEFT JOIN users u ON qa.submitted_by = u.user_id
                  WHERE qa.status = :status
                  ORDER BY qa.submitted_at DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->execute();
        $approvals = $stmt->fetchAll();
        
        // Calculate progress for each
        foreach ($approvals as &$approval) {
            $progress = $approval['total_devices'] > 0 
                ? ($approval['completed_devices'] / $approval['total_devices']) * 100 
                : 0;
            $approval['progress'] = round($progress, 1);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Quality approvals retrieved successfully',
            'data' => $approvals
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error in handleGetRequest: ' . $e->getMessage()
        ]);
    }
}

function handlePostRequest() {
    global $user_id;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            sendResponse(false, 'Invalid JSON input');
        }
        
        // Validate required fields
        if (!isset($input['approval_id']) || !isset($input['action'])) {
            sendResponse(false, 'Approval ID and action are required');
        }
        
        $approval_id = $input['approval_id'];
        $action = $input['action'];
        $comments = $input['comments'] ?? '';
        
        if (!in_array($action, ['approve', 'reject'])) {
            sendResponse(false, 'Invalid action. Must be approve or reject.');
        }
        
        $db = new Database();
        $conn = $db->getConnection();
        
        // Get approval details
        $get_query = "SELECT * FROM quality_approvals WHERE approval_id = :approval_id";
        $get_stmt = $conn->prepare($get_query);
        $get_stmt->bindParam(':approval_id', $approval_id);
        $get_stmt->execute();
        $approval = $get_stmt->fetch();
        
        if (!$approval) {
            sendResponse(false, 'Approval record not found');
        }
        
        if ($approval['status'] !== 'pending') {
            sendResponse(false, 'Approval already processed');
        }
        
        $conn->beginTransaction();
        
        try {
            // Update approval record
            $status = $action === 'approve' ? 'approved' : 'rejected';
            $update_query = "UPDATE quality_approvals SET 
                            quality_engineer_id = :quality_engineer_id,
                            approved_at = NOW(),
                            status = :status,
                            comments = :comments
                            WHERE approval_id = :approval_id";
            
            $update_stmt = $conn->prepare($update_query);
            $update_stmt->bindParam(':quality_engineer_id', $user_id);
            $update_stmt->bindParam(':status', $status);
            $update_stmt->bindParam(':comments', $comments);
            $update_stmt->bindParam(':approval_id', $approval_id);
            $update_stmt->execute();
            
            // Update job order status
            if ($action === 'approve') {
                $job_status = 'completed';
            } else {
                $job_status = 'rejected';
            }
            
            $job_query = "UPDATE job_orders SET status = :status WHERE job_order_id = :job_order_id";
            $job_stmt = $conn->prepare($job_query);
            $job_stmt->bindParam(':status', $job_status);
            $job_stmt->bindParam(':job_order_id', $approval['job_order_id']);
            $job_stmt->execute();
            
            // Commit transaction
            $conn->commit();
            
            // Log activity
            logActivity($user_id, 'quality_approval', "Job order {$approval['job_order_id']} - $action");
            
            sendResponse(true, "Job order $action" . "d successfully", [
                'approval_id' => $approval_id,
                'status' => $status
            ]);
            
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error in handlePostRequest: ' . $e->getMessage()
        ]);
    }
}

function sendResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}
?>


