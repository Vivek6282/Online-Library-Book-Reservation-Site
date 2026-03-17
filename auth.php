<?php
// php/auth.php
// Handles scholar authentication (Login and Signup)

require_once 'config.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? '';

if ($action === 'login') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $stmt = $pdo->prepare("SELECT id, full_name, username, password, role FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Remove password from response
        unset($user['password']);
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid username or credentials.']);
    }
} 

elseif ($action === 'signup') {
    $fullName = $_POST['fullName'] ?? '';
    $email = $_POST['email'] ?? '';
    $username = $_POST['username'] ?? '';
    $password = password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, username, password) VALUES (?, ?, ?, ?)");
        $stmt->execute([$fullName, $email, $username, $password]);
        
        $userId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'message' => 'Scholar account created.', 'user' => [
            'id' => $userId,
            'full_name' => $fullName,
            'username' => $username,
            'role' => 'user'
        ]]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['success' => false, 'message' => 'Username or email already exists.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'System error: ' . $e->getMessage()]);
        }
    }
}
?>
