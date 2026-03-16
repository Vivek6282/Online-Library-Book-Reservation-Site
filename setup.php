<?php
// php/setup.php
// Script to initialize the database and tables automatically

$host = 'localhost';
$user = 'root';
$pass = '';

try {
    $conn = new PDO("mysql:host=$host", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create Database
    $conn->exec("CREATE DATABASE IF NOT EXISTS ajce_archive");
    $conn->exec("USE ajce_archive");

    // Load and execute schema.sql
    $sql = file_get_contents('../database/schema.sql');
    $conn->exec($sql);

    echo "Archival Database System Initialized Successfully.<br>";
    echo "Default Admin: <b>admin</b> / <b>password</b> (if newly created).<br>";
    echo "<a href='../login.html'>Proceed to Login</a>";

} catch (PDOException $e) {
    die("Setup failed: " . $e->getMessage());
}
?>
