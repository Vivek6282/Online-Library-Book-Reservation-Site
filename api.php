<?php
/**
 * api.php — Central API Router
 * ============================================================
 * All frontend JS (login.js, admin.js, library scripts) calls
 * this single file with ?action=... query parameters.
 * This router dispatches to the appropriate logic.
 * ============================================================
 */

require_once __DIR__ . '/config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    // ──────────────────────────────────────────────────────────
    // AUTH: Login
    // ──────────────────────────────────────────────────────────
    case 'login':
        $idNo = $_POST['id_no'] ?? $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';

        // Allow login by member_id OR username
        $stmt = $pdo->prepare("SELECT id, member_id, full_name, username, password, role FROM users WHERE member_id = ? OR username = ?");
        $stmt->execute([$idNo, $idNo]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            unset($user['password']);
            // Map fields to what frontend expects
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'id_no' => $user['member_id'],
                    'full_name' => $user['full_name'],
                    'username' => $user['username'],
                    'role' => $user['role']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid credentials. Please check your ID and password.']);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // AUTH: Register / Signup
    // ──────────────────────────────────────────────────────────
    case 'register':
        $idNo     = $_POST['id_no'] ?? '';
        $fullName = $_POST['full_name'] ?? $_POST['fullName'] ?? '';
        $email    = $_POST['email'] ?? '';
        $password = password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT);

        if (empty($idNo) || empty($fullName) || empty($email) || empty($_POST['password'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'All fields are required.']);
            break;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO users (member_id, full_name, email, username, password, role) VALUES (?, ?, ?, ?, ?, 'user')");
            $stmt->execute([$idNo, $fullName, $email, $idNo, $password]);

            $userId = $pdo->lastInsertId();
            echo json_encode([
                'success' => true,
                'message' => 'Scholar account created.',
                'user' => [
                    'id' => $userId,
                    'id_no' => $idNo,
                    'full_name' => $fullName,
                    'role' => 'user'
                ]
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'An account with this ID or email already exists.']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'System error: ' . $e->getMessage()]);
            }
        }
        break;

    // ──────────────────────────────────────────────────────────
    // ADMIN: Get all users
    // ──────────────────────────────────────────────────────────
    case 'get_users':
        try {
            $stmt = $pdo->query("SELECT id, member_id AS id_no, full_name, email, role FROM users ORDER BY id");
            $users = $stmt->fetchAll();
            echo json_encode(['success' => true, 'users' => $users]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // ADMIN: Delete user
    // ──────────────────────────────────────────────────────────
    case 'delete_user':
        $id = $_POST['id'] ?? '';
        if (empty($id)) {
            echo json_encode(['success' => false, 'error' => 'User ID required.']);
            break;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role != 'admin'");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'User removed.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // BOOKS: Load all books
    // ──────────────────────────────────────────────────────────
    case 'load':
        try {
            $stmt = $pdo->query("SELECT * FROM books ORDER BY id");
            $books = $stmt->fetchAll();
            echo json_encode(['success' => true, 'books' => $books]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // BOOKS: Add a new book (admin)
    // ──────────────────────────────────────────────────────────
    case 'add_book':
        // admin.js sends JSON body
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            // fallback to POST form data
            $input = $_POST;
        }

        $title   = $input['title'] ?? '';
        $author  = $input['author'] ?? '';
        $genre   = $input['genre'] ?? '';
        $stock   = intval($input['stock'] ?? 0);
        $image   = $input['image'] ?? 'images/IMG-20260316-WA0045.jpg';
        $summary = $input['summary'] ?? '';

        if (empty($title) || empty($author)) {
            echo json_encode(['success' => false, 'error' => 'Title and author are required.']);
            break;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO books (title, author, genre, summary, stock, image) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $author, $genre, $summary, $stock, $image]);
            echo json_encode(['success' => true, 'message' => 'Book added.', 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // BOOKS: Delete a book (admin)
    // ──────────────────────────────────────────────────────────
    case 'delete_book':
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        if (empty($id)) {
            echo json_encode(['success' => false, 'error' => 'Book ID required.']);
            break;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM books WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Book deleted.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // RESERVATIONS: Add reservation
    // ──────────────────────────────────────────────────────────
    case 'reserve':
        $userId    = $_POST['userId'] ?? '';
        $bookId    = $_POST['bookId'] ?? '';
        $bookTitle = $_POST['bookTitle'] ?? '';
        $days      = intval($_POST['days'] ?? 7);

        if (empty($userId) || empty($bookId)) {
            echo json_encode(['success' => false, 'error' => 'User ID and Book ID are required.']);
            break;
        }

        // Business Logic: 1-book limit
        $check = $pdo->prepare("SELECT COUNT(*) FROM reservations WHERE user_id = ? AND status = 'active'");
        $check->execute([$userId]);
        if ($check->fetchColumn() >= 1) {
            echo json_encode(['success' => false, 'error' => 'Scholars may only hold one record at a time.']);
            break;
        }

        $dueDate = date('Y-m-d', strtotime("+$days days"));
        try {
            $stmt = $pdo->prepare("INSERT INTO reservations (user_id, book_id, book_title, due_date) VALUES (?, ?, ?, ?)");
            $stmt->execute([$userId, $bookId, $bookTitle, $dueDate]);

            // Decrement stock
            $pdo->prepare("UPDATE books SET stock = stock - 1 WHERE id = ? AND stock > 0")->execute([$bookId]);

            echo json_encode(['success' => true, 'message' => 'Book reserved successfully!']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // RESERVATIONS: Get user's reservations
    // ──────────────────────────────────────────────────────────
    case 'get_reservations':
        $userId = $_GET['userId'] ?? $_POST['userId'] ?? '';
        if (empty($userId)) {
            echo json_encode(['success' => false, 'error' => 'User ID required.']);
            break;
        }
        try {
            $stmt = $pdo->prepare("SELECT r.*, b.title, b.author, b.image FROM reservations r LEFT JOIN books b ON r.book_id = b.id WHERE r.user_id = ? AND r.status = 'active'");
            $stmt->execute([$userId]);
            $items = $stmt->fetchAll();
            echo json_encode(['success' => true, 'reservations' => $items]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // RESERVATIONS: Remove reservation
    // ──────────────────────────────────────────────────────────
    case 'remove_reservation':
        $resId  = $_POST['resId'] ?? '';
        $userId = $_POST['userId'] ?? '';
        if (empty($resId)) {
            echo json_encode(['success' => false, 'error' => 'Reservation ID required.']);
            break;
        }
        try {
            // Get the book_id before deleting to restore stock
            $getStmt = $pdo->prepare("SELECT book_id FROM reservations WHERE id = ?");
            $getStmt->execute([$resId]);
            $res = $getStmt->fetch();

            $stmt = $pdo->prepare("DELETE FROM reservations WHERE id = ?");
            $stmt->execute([$resId]);

            // Restore stock
            if ($res) {
                $pdo->prepare("UPDATE books SET stock = stock + 1 WHERE id = ?")->execute([$res['book_id']]);
            }

            echo json_encode(['success' => true, 'message' => 'Reservation removed.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // STATS: Admin dashboard statistics
    // ──────────────────────────────────────────────────────────
    case 'stats':
        try {
            $userCount = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'user'")->fetchColumn();
            $resCount  = $pdo->query("SELECT COUNT(*) FROM reservations WHERE status = 'active'")->fetchColumn();
            $bookCount = $pdo->query("SELECT COUNT(*) FROM books")->fetchColumn();
            echo json_encode([
                'success' => true,
                'userCount' => $userCount,
                'resCount' => $resCount,
                'bookCount' => $bookCount
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // ──────────────────────────────────────────────────────────
    // DEFAULT: Unknown action
    // ──────────────────────────────────────────────────────────
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Unknown action: ' . $action]);
        break;
}
?>
