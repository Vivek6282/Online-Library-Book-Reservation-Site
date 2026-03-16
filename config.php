<?php
// php/config.php
// Database configuration and connection handler

define('DB_HOST', 'localhost');
define('DB_NAME', 'ajce_archive');
define('DB_USER', 'root');
define('DB_PASS', ''); // Default XAMPP password is empty

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Return error as JSON if this is an API call
    header('Content-Type: application/json');
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
?>
