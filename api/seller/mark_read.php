<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../includes/db_connect.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id > 0) {
    $sql = "UPDATE notifications SET is_read = 1 WHERE id = $id";
    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => $conn->error]);
    }
}
$conn->close();
?>