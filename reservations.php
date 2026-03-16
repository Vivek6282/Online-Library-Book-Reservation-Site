<?php
// php/reservations.php
// Manages archival book reservations for patrons

require_once 'config.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';
$userId = $_POST['userId'] ?? $_GET['userId'] ?? null;

if (!$userId) {
    die(json_encode(['success' => false, 'message' => 'Scholar ID required.']));
}

if ($action === 'list') {
    $stmt = $pdo->prepare("SELECT * FROM reservations WHERE user_id = ? AND status = 'active'");
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();
    echo json_encode(['success' => true, 'reservations' => $items]);
}

elseif ($action === 'add') {
    $bookId = $_POST['bookId'] ?? '';
    $bookTitle = $_POST['bookTitle'] ?? '';
    $days = $_POST['days'] ?? 7;

    // Check Business Logic: 1-book limit
    $check = $pdo->prepare("SELECT COUNT(*) FROM reservations WHERE user_id = ? AND status = 'active'");
    $check->execute([$userId]);
    if ($check->fetchColumn() >= 1) {
        die(json_encode(['success' => false, 'message' => 'Scholars may only hold one record at a time.']));
    }

    $dueDate = date('Y-m-d', strtotime("+$days days"));

    try {
        $stmt = $pdo->prepare("INSERT INTO reservations (user_id, book_id, book_title, due_date) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $bookId, $bookTitle, $dueDate]);
        echo json_encode(['success' => true, 'message' => 'Record secured in the Archive.']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Archival error: ' . $e->getMessage()]);
    }
}

elseif ($action === 'remove') {
    $resId = $_POST['resId'] ?? '';
    $stmt = $pdo->prepare("DELETE FROM reservations WHERE id = ? AND user_id = ?");
    $stmt->execute([$resId, $userId]);
    echo json_encode(['success' => true, 'message' => 'Record released.']);
}
?>
