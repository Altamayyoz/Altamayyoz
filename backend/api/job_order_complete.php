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

    // Production/Technician role can mark complete
    if (!$user_id) {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required'
        ]);
        exit;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Initialization error: ' . $e->getMessage()
    ]);
    exit;
}

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        handlePostRequest();
        break;
    default:
        sendResponse(false, 'Invalid request method');
}

function handlePostRequest() {
    global $user_id;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            sendResponse(false, 'Invalid JSON input');
        }
        
        // Validate required fields
        if (!isset($input['job_order_id'])) {
            sendResponse(false, 'Job order ID is required');
        }
        
        $job_order_id = $input['job_order_id'];
        
        $db = new Database();
        $conn = $db->getConnection();
        
        // Check if job order exists
        $check_query = "SELECT * FROM job_orders WHERE job_order_id = :job_order_id";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bindParam(':job_order_id', $job_order_id);
        $check_stmt->execute();
        $job_order = $check_stmt->fetch();
        
        if (!$job_order) {
            sendResponse(false, 'Job order not found');
        }
        
        // Update job order status to 'pending_quality' instead of 'completed'
        $update_query = "UPDATE job_orders SET status = 'pending_quality', quality_submitted_at = NOW() WHERE job_order_id = :job_order_id";
        $update_stmt = $conn->prepare($update_query);
        $update_stmt->bindParam(':job_order_id', $job_order_id);
        
        if ($update_stmt->execute()) {
            // Create quality approval record
            $approval_query = "INSERT INTO quality_approvals (job_order_id, submitted_by, submitted_at, status) 
                              VALUES (:job_order_id, :submitted_by, NOW(), 'pending')";
            $approval_stmt = $conn->prepare($approval_query);
            $approval_stmt->bindParam(':job_order_id', $job_order_id);
            $approval_stmt->bindParam(':submitted_by', $user_id);
            $approval_stmt->execute();
            
            // Log activity
            logActivity($user_id, 'job_order_completed', "Job order $job_order_id marked complete and sent to quality engineer");
            
            sendResponse(true, 'Job order marked complete and sent to quality engineer for approval', [
                'job_order_id' => $job_order_id,
                'status' => 'pending_quality'
            ]);
        } else {
            sendResponse(false, 'Failed to update job order status');
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


