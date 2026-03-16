<?php
// php/stats.php
// Provides administrative statistics for the Archive

require_once 'config.php';
header('Content-Type: application/json');

try {
    // Total number of scholars appeared
    $userStmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    $userCount = $userStmt->fetchColumn();

    // Total number of active reservations
    $resStmt = $pdo->query("SELECT COUNT(*) FROM reservations WHERE status = 'active'");
    $resCount = $resStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'userCount' => $userCount,
        'resCount' => $resCount
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
