<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "db.php";

$result = $conn->query("SELECT * FROM estudos ORDER BY id DESC");

$estudos = [];

while ($row = $result->fetch_assoc()) {
    $estudos[] = $row;
}

echo json_encode($estudos);

$conn->close();
?>