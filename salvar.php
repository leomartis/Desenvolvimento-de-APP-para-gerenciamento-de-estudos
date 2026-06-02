<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$materia = $data['materia'] ?? '';
$topico = $data['topico'] ?? '';

if (!$materia || !$topico) {
    echo json_encode(["status" => "erro", "msg" => "Dados inválidos. Preencha matéria e tópico."]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO estudos (materia, topico) VALUES (?, ?)");
$stmt->bind_param("ss", $materia, $topico);

if ($stmt->execute()) {
    echo json_encode([
        "status" => "sucesso",
        "id" => $stmt->insert_id
    ]);
} else {
    echo json_encode([
        "status" => "erro",
        "msg" => $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>