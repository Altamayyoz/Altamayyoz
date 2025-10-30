<?php
// Set CORS headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

$user_id = $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? '';

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Ensure table exists (idempotent)
    $conn->exec("CREATE TABLE IF NOT EXISTS worker_assignments (
        assignment_id INT AUTO_INCREMENT PRIMARY KEY,
        job_order_id VARCHAR(50) NOT NULL,
        assigned_to_user_id INT NOT NULL,
        assigned_role VARCHAR(50) NOT NULL,
        assigned_by_user_id INT NOT NULL,
        notes TEXT DEFAULT NULL,
        status ENUM('assigned','in_progress','completed','cancelled') DEFAULT 'assigned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // If mine=1, return assignments for current user (e.g., ProductionWorker)
        $mine = isset($_GET['mine']) ? (int)$_GET['mine'] : 0;
        if ($mine === 1) {
            $query = "SELECT wa.assignment_id, wa.job_order_id, wa.status, wa.created_at,
                             jo.total_devices, jo.due_date, jo.priority, jo.description, jo.progress_percentage
                      FROM worker_assignments wa
                      JOIN job_orders jo ON jo.job_order_id = wa.job_order_id
                      WHERE wa.assigned_to_user_id = :uid AND wa.status IN ('assigned','in_progress')
                      ORDER BY wa.created_at DESC";
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':uid', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'message' => 'Assignments retrieved',
                'data' => $rows
            ]);
            exit;
        }

        echo json_encode(['success' => false, 'message' => 'Invalid GET parameters']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Only supervisors can assign
        if (strtolower($user_role) !== 'supervisor') {
            echo json_encode(['success' => false, 'message' => 'Access denied. Supervisor role required.']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            exit;
        }

        $job_order_id = $input['job_order_id'] ?? '';
        $assigned_to_user_id = isset($input['assigned_to_user_id']) ? (int)$input['assigned_to_user_id'] : 0;
        $assigned_role = $input['assigned_role'] ?? '';
        $notes = $input['notes'] ?? null;

        if (!$job_order_id || !$assigned_to_user_id || !$assigned_role) {
            echo json_encode(['success' => false, 'message' => 'job_order_id, assigned_to_user_id and assigned_role are required']);
            exit;
        }

        $insert = $conn->prepare("INSERT INTO worker_assignments (job_order_id, assigned_to_user_id, assigned_role, assigned_by_user_id, notes)
                                   VALUES (:jo, :to_user, :role, :by_user, :notes)");
        $insert->bindValue(':jo', $job_order_id);
        $insert->bindValue(':to_user', $assigned_to_user_id, PDO::PARAM_INT);
        $insert->bindValue(':role', $assigned_role);
        $insert->bindValue(':by_user', $user_id, PDO::PARAM_INT);
        $insert->bindValue(':notes', $notes);
        $insert->execute();

        echo json_encode(['success' => true, 'message' => 'Assignment created', 'data' => ['assignment_id' => $conn->lastInsertId()]]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
} catch (Exception $e) {
    error_log('assignments.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>


