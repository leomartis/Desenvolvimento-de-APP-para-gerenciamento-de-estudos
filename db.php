<?php
$host = "localhost";
$db = "app_db";
$user = "root";
$pass = "123456";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Erro: " . $conn->connect_error);
}

$conn->set_charset("utf8");
?>