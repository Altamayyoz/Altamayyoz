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
    case 'POST':
        handlePostRequest();
        break;
    case 'PUT':
        handlePutRequest();
        break;
    case 'DELETE':
        handleDeleteRequest();
        break;
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Invalid request method'
        ]);
}

function handleGetRequest() {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        $query = "SELECT * FROM technicians ORDER BY technician_id";
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        $technicians = $stmt->fetchAll();
        
        // Add user information separately to avoid join issues
        foreach ($technicians as &$technician) {
            $userQuery = "SELECT name, username, email, role FROM users WHERE user_id = :user_id";
            $userStmt = $conn->prepare($userQuery);
            $userStmt->bindParam(':user_id', $technician['user_id']);
            $userStmt->execute();
            $user = $userStmt->fetch();
            
            if ($user) {
                $technician['name'] = $user['name'];
                $technician['username'] = $user['username'];
                $technician['email'] = $user['email'];
                $technician['role'] = $user['role'];
            } else {
                $technician['name'] = 'Unknown';
                $technician['username'] = 'N/A';
                $technician['email'] = 'N/A';
                $technician['role'] = 'technician';
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Technicians retrieved successfully',
            'data' => $technicians
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error retrieving technicians: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    } catch (Error $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error retrieving technicians: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    }
}

function handlePostRequest() {
    try {
        global $user_role;
        
        // Only engineers can create technicians
        if ($user_role !== 'engineer') {
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Engineer role required.'
            ]);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required_fields = ['user_id', 'station_assigned'];
        $errors = validateInput($input, $required_fields);
        
        if (!empty($errors)) {
            echo json_encode([
                'success' => false,
                'message' => 'Validation failed: ' . implode(', ', $errors)
            ]);
            return;
        }
        
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        $query = "INSERT INTO technicians (user_id, station_assigned, status) 
                  VALUES (:user_id, :station_assigned, :status)";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $input['user_id']);
        $stmt->bindParam(':station_assigned', $input['station_assigned']);
        $status = $input['status'] ?? 'active';
        $stmt->bindParam(':status', $status);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Technician created successfully',
                'data' => ['technician_id' => $conn->lastInsertId()]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create technician'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error creating technician: ' . $e->getMessage()
        ]);
    }
}

function handlePutRequest() {
    try {
        global $user_role;
        
        // Only engineers can update technicians
        if ($user_role !== 'engineer') {
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Engineer role required.'
            ]);
            return;
        }
        
        $technician_id = $_GET['id'] ?? null;
        if (!$technician_id) {
            echo json_encode([
                'success' => false,
                'message' => 'Technician ID required'
            ]);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        $query = "UPDATE technicians SET station_assigned = :station_assigned, status = :status 
                  WHERE technician_id = :technician_id";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':station_assigned', $input['station_assigned']);
        $stmt->bindParam(':status', $input['status']);
        $stmt->bindParam(':technician_id', $technician_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Technician updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update technician'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error updating technician: ' . $e->getMessage()
        ]);
    }
}

function handleDeleteRequest() {
    try {
        global $user_role;
        
        // Only engineers can delete technicians
        if ($user_role !== 'engineer') {
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Engineer role required.'
            ]);
            return;
        }
        
        $technician_id = $_GET['id'] ?? null;
        if (!$technician_id) {
            echo json_encode([
                'success' => false,
                'message' => 'Technician ID required'
            ]);
            return;
        }
        
        $db = new Database();
        $conn = $db->getConnection();
        
        if (!$conn) {
            throw new Exception('Database connection failed');
        }
        
        $query = "DELETE FROM technicians WHERE technician_id = :technician_id";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':technician_id', $technician_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Technician deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete technician'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error deleting technician: ' . $e->getMessage()
        ]);
    }
}
?>