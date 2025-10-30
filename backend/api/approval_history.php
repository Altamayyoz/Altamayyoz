<?php
// Basic JSON API to return recent approval history
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

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    if ($limit <= 0 || $limit > 200) { $limit = 20; }

    // Join to enrich with names and task details
    $sql = "
        SELECT 
            ah.approval_history_id,
            ah.task_id,
            ah.supervisor_id,
            ah.technician_id,
            ah.action_type,
            ah.comments,
            ah.approval_date,
            t.operation_name,
            t.devices_completed,
            t.efficiency_percentage,
            jo.job_order_id,
            su.name AS supervisor_name,
            tu.name AS technician_name
        FROM approval_history ah
        LEFT JOIN tasks t ON ah.task_id = t.task_id
        LEFT JOIN job_orders jo ON t.job_order_id = jo.job_order_id
        LEFT JOIN users su ON ah.supervisor_id = su.user_id
        LEFT JOIN technicians tech ON ah.technician_id = tech.technician_id
        LEFT JOIN users tu ON tech.user_id = tu.user_id
        ORDER BY ah.approval_date DESC
        LIMIT :limit
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Approval history loaded',
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

// Start session FIRST before any headers or output
session_start();

// Set proper headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

    // Check if user is logged in
    if (!$user_id) {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required. Please log in.'
        ]);
        exit;
    }

    // Only engineers and supervisors can view approval history
    if (!in_array($user_role, ['engineer', 'supervisor'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Access denied. Engineer or Supervisor role required.'
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

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    handleGetRequest();
} else {
    sendResponse(false, 'Invalid request method');
}

function handleGetRequest() {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        // Get filter parameters
        $action_filter = $_GET['action'] ?? null; // 'approved' or 'rejected'
        $technician_filter = $_GET['technician_id'] ?? null;
        $date_from = $_GET['date_from'] ?? null;
        $date_to = $_GET['date_to'] ?? null;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        // Build query
        $query = "SELECT 
                    ah.*,
                    t.operation_name,
                    t.devices_completed,
                    t.actual_time_minutes,
                    t.standard_time_minutes,
                    t.efficiency_percentage,
                    sup.name as supervisor_name,
                    tech.user_id as technician_user_id,
                    u.name as technician_name,
                    jo.job_order_id
                  FROM approval_history ah
                  LEFT JOIN tasks t ON ah.task_id = t.task_id
                  LEFT JOIN users sup ON ah.supervisor_id = sup.user_id
                  LEFT JOIN technicians tech ON ah.technician_id = tech.technician_id
                  LEFT JOIN users u ON tech.user_id = u.user_id
                  LEFT JOIN job_orders jo ON t.job_order_id = jo.job_order_id
                  WHERE 1=1";
        
        $params = [];
        
        // Apply filters
        if ($action_filter && in_array($action_filter, ['approved', 'rejected'])) {
            $query .= " AND ah.action_type = :action_type";
            $params[':action_type'] = $action_filter;
        }
        
        if ($technician_filter) {
            $query .= " AND ah.technician_id = :technician_id";
            $params[':technician_id'] = $technician_filter;
        }
        
        if ($date_from) {
            $query .= " AND DATE(ah.approval_date) >= :date_from";
            $params[':date_from'] = $date_from;
        }
        
        if ($date_to) {
            $query .= " AND DATE(ah.approval_date) <= :date_to";
            $params[':date_to'] = $date_to;
        }
        
        $query .= " ORDER BY ah.approval_date DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $conn->prepare($query);
        
        // Bind parameters
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count for pagination
        $count_query = "SELECT COUNT(*) as total FROM approval_history ah WHERE 1=1";
        $count_params = [];
        
        if ($action_filter) {
            $count_query .= " AND ah.action_type = :action_type";
            $count_params[':action_type'] = $action_filter;
        }
        
        if ($technician_filter) {
            $count_query .= " AND ah.technician_id = :technician_id";
            $count_params[':technician_id'] = $technician_filter;
        }
        
        if ($date_from) {
            $count_query .= " AND DATE(ah.approval_date) >= :date_from";
            $count_params[':date_from'] = $date_from;
        }
        
        if ($date_to) {
            $count_query .= " AND DATE(ah.approval_date) <= :date_to";
            $count_params[':date_to'] = $date_to;
        }
        
        $count_stmt = $conn->prepare($count_query);
        foreach ($count_params as $key => $value) {
            $count_stmt->bindValue($key, $value);
        }
        $count_stmt->execute();
        $total = $count_stmt->fetch()['total'];
        
        echo json_encode([
            'success' => true,
            'message' => 'Approval history retrieved successfully',
            'data' => $history,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error retrieving approval history: ' . $e->getMessage()
        ]);
    } catch (Error $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error: ' . $e->getMessage()
        ]);
    }
}

function sendResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}
?>


