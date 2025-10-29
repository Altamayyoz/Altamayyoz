<?php
// Operations CRUD API (for Task Templates)
// Turn off error display to prevent HTML output before JSON
// Temporarily enable to debug - will be disabled in production
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
// Output errors to response for debugging
$error_handler = set_error_handler(function($severity, $message, $file, $line) {
    error_log("PHP Error [$severity]: $message in $file:$line");
    return true; // Suppress default error handler
});

require_once '../config.php';

// Set proper headers FIRST
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session once at the top level
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetRequest($conn);
            break;
        case 'POST':
            handlePostRequest($conn);
            break;
        case 'PUT':
            handlePutRequest($conn);
            break;
        case 'DELETE':
            handleDeleteRequest($conn);
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
    $operation_id = $_GET['id'] ?? null;
    
    if ($operation_id) {
        // Get single operation
        $query = "SELECT operation_id, operation_name, standard_time as standard_time_minutes, description, category, created_at 
                  FROM operations 
                  WHERE operation_id = :operation_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':operation_id', $operation_id);
        $stmt->execute();
        
        $operation = $stmt->fetch();
        
        if ($operation) {
            echo json_encode([
                'success' => true,
                'message' => 'Operation retrieved successfully',
                'data' => $operation
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Operation not found'
            ]);
        }
    } else {
        // Get all operations
        $query = "SELECT operation_id, operation_name, standard_time as standard_time_minutes, description, category, created_at 
                  FROM operations 
                  ORDER BY operation_name ASC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        $operations = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'message' => 'Operations retrieved successfully',
            'data' => $operations
        ]);
    }
}

function handlePostRequest($conn) {
    try {
        // Session is already started at top level
        $user_id = $_SESSION['user_id'] ?? 1;
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            return;
        }
        
        // Validate required fields
        $required_fields = ['operation_name', 'standard_time_minutes', 'category'];
        $errors = validateInput($input, $required_fields);
        
        if (!empty($errors)) {
            echo json_encode(['success' => false, 'message' => 'Validation failed: ' . implode(', ', $errors)]);
            return;
        }
        
        // Check if operation already exists
        $check_query = "SELECT operation_id FROM operations WHERE operation_name = :operation_name";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bindParam(':operation_name', $input['operation_name']);
        $check_stmt->execute();
        
        if ($check_stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Operation with this name already exists']);
            return;
        }
        
        // Insert operation
        // Note: Database column is 'standard_time', but API accepts 'standard_time_minutes'
        $query = "INSERT INTO operations (operation_name, standard_time, description, category, created_at) 
                  VALUES (:operation_name, :standard_time, :description, :category, NOW())";
        
        // Ensure standard_time_minutes is an integer
        $standard_time = (int)$input['standard_time_minutes'];
        if ($standard_time <= 0) {
            echo json_encode(['success' => false, 'message' => 'Standard time must be greater than 0']);
            return;
        }
        
        $stmt = $conn->prepare($query);
        $stmt->bindValue(':operation_name', $input['operation_name'], PDO::PARAM_STR);
        $stmt->bindValue(':standard_time', $standard_time, PDO::PARAM_INT);
        $stmt->bindValue(':description', $input['description'] ?? '', PDO::PARAM_STR);
        $stmt->bindValue(':category', $input['category'], PDO::PARAM_STR);
        
        if ($stmt->execute()) {
            if (function_exists('logActivity') && $user_id) {
                try {
                    logActivity($user_id, 'create_operation', "Created operation: {$input['operation_name']}");
                } catch (Exception $e) {
                    // Ignore logging errors
                    error_log("Activity logging failed: " . $e->getMessage());
                }
            }
            echo json_encode([
                'success' => true,
                'message' => 'Operation created successfully',
                'data' => ['operation_id' => $conn->lastInsertId()]
            ]);
        } else {
            // Get detailed error info
            $errorInfo = $stmt->errorInfo();
            error_log("Failed to create operation. Error: " . print_r($errorInfo, true));
            echo json_encode([
                'success' => false, 
                'message' => 'Failed to create operation: ' . ($errorInfo[2] ?? 'Unknown error')
            ]);
        }
    } catch (PDOException $e) {
        error_log("Database error in handlePostRequest: " . $e->getMessage());
        error_log("PDO Error Info: " . print_r($e->errorInfo ?? [], true));
        echo json_encode([
            'success' => false, 
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        error_log("Error in handlePostRequest: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode([
            'success' => false, 
            'message' => 'An error occurred: ' . $e->getMessage()
        ]);
    }
}

function handlePutRequest($conn) {
    try {
        // Session is already started at top level
        $user_id = $_SESSION['user_id'] ?? 1;
        
        $operation_id = $_GET['id'] ?? null;
        if (!$operation_id) {
            echo json_encode(['success' => false, 'message' => 'Operation ID required']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            return;
        }
        
        // Check if operation exists
        $check_query = "SELECT * FROM operations WHERE operation_id = :operation_id";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bindParam(':operation_id', $operation_id);
        $check_stmt->execute();
        
        if (!$check_stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Operation not found']);
            return;
        }
        
        // Update operation
        $query = "UPDATE operations SET ";
        $updates = [];
        $params = [':operation_id' => $operation_id];
        
        $allowed_fields = ['operation_name', 'standard_time_minutes', 'description', 'category'];
        
        foreach ($allowed_fields as $field) {
            if (isset($input[$field])) {
                // Map standard_time_minutes to standard_time for database
                $db_field = ($field === 'standard_time_minutes') ? 'standard_time' : $field;
                $updates[] = "$db_field = :$field";
                $params[":$field"] = $input[$field];
            }
        }
        
        if (empty($updates)) {
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            return;
        }
        
        $query .= implode(', ', $updates) . " WHERE operation_id = :operation_id";
        
        $stmt = $conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        if ($stmt->execute()) {
            if (function_exists('logActivity') && $user_id) {
                try {
                    logActivity($user_id, 'update_operation', "Updated operation: $operation_id");
                } catch (Exception $e) {
                    error_log("Activity logging failed: " . $e->getMessage());
                }
            }
            echo json_encode(['success' => true, 'message' => 'Operation updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update operation']);
        }
    } catch (PDOException $e) {
        error_log("Database error in handlePutRequest: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error occurred']);
    } catch (Exception $e) {
        error_log("Error in handlePutRequest: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
    }
}

function handleDeleteRequest($conn) {
    try {
        // Session is already started at top level
        $user_id = $_SESSION['user_id'] ?? 1;
        
        $operation_id = $_GET['id'] ?? null;
        if (!$operation_id) {
            echo json_encode(['success' => false, 'message' => 'Operation ID required']);
            return;
        }
        
        // Check if operation exists
        $check_query = "SELECT operation_name FROM operations WHERE operation_id = :operation_id";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bindParam(':operation_id', $operation_id);
        $check_stmt->execute();
        
        $operation = $check_stmt->fetch();
        if (!$operation) {
            echo json_encode(['success' => false, 'message' => 'Operation not found']);
            return;
        }
        
        // Delete operation
        $query = "DELETE FROM operations WHERE operation_id = :operation_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':operation_id', $operation_id);
        
        if ($stmt->execute()) {
            if (function_exists('logActivity') && $user_id) {
                try {
                    logActivity($user_id, 'delete_operation', "Deleted operation: {$operation['operation_name']}");
                } catch (Exception $e) {
                    error_log("Activity logging failed: " . $e->getMessage());
                }
            }
            echo json_encode(['success' => true, 'message' => 'Operation deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete operation']);
        }
    } catch (PDOException $e) {
        error_log("Database error in handleDeleteRequest: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error occurred']);
    } catch (Exception $e) {
        error_log("Error in handleDeleteRequest: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
    }
}
?>

