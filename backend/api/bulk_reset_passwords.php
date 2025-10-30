<?php
// Bulk reset all user passwords to strong temporary values
// Returns a CSV with username, name, email, temp_password
require_once '../config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = new Database();
    $conn = $db->getConnection();

    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    // Fetch all users
    $stmt = $conn->prepare("SELECT user_id, username, name, email FROM users");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$users) {
        echo json_encode(['success' => true, 'message' => 'No users found', 'data' => []]);
        exit;
    }

    // Prepare update statement
    $update = $conn->prepare("UPDATE users SET password = :password WHERE user_id = :id");

    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%&*?!';
    $resets = [];

    foreach ($users as $u) {
        // Generate strong temp password (14+ chars, include at least one of each class)
        $temp = '';
        for ($i = 0; $i < 14; $i++) {
            $temp .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        // Append class guarantees
        $temp .= 'Aa1!';

        $hash = password_hash($temp, PASSWORD_DEFAULT);
        $update->execute([':password' => $hash, ':id' => $u['user_id']]);

        $resets[] = [
            'username' => $u['username'],
            'name' => $u['name'] ?? '',
            'email' => $u['email'] ?? '',
            'temp_password' => $temp
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Passwords reset successfully',
        'data' => $resets
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

<?php
?>
