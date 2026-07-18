<?php
// setup.php
// Script to initialize the database and tables automatically
// Run this once via browser: http://localhost/awt/setup.php

$host = 'localhost';
$user = 'root';
$pass = '';

try {
    $conn = new PDO("mysql:host=$host", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create Database
    $conn->exec("CREATE DATABASE IF NOT EXISTS ajce_archive");
    $conn->exec("USE ajce_archive");

    // Load and execute schema.sql (same directory as this file)
    $schemaPath = __DIR__ . '/schema.sql';
    if (!file_exists($schemaPath)) {
        die("Error: schema.sql not found at: " . $schemaPath);
    }

    $sql = file_get_contents($schemaPath);
    
    // Execute each statement separately (multi_query workaround for PDO)
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($s) { return !empty($s); }
    );
    
    foreach ($statements as $statement) {
        $conn->exec($statement);
    }

    echo "<h2 style='color: green;'>✅ Archival Database System Initialized Successfully.</h2>";
    echo "<p><strong>Admin Credentials:</strong></p>";
    echo "<ul>";
    echo "<li><strong>Username / ID:</strong> 911</li>";
    echo "<li><strong>Password:</strong> admin123</li>";
    echo "</ul>";
    echo "<br><a href='login.html' style='font-size: 1.2rem;'>➡ Proceed to Login</a>";

} catch (PDOException $e) {
    die("<h2 style='color: red;'>Setup failed:</h2><pre>" . $e->getMessage() . "</pre>");
}
?>
