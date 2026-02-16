<?php
header("Content-Type: application/json");
include("../../includes/db_connect.php");

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['product_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "ไม่พบรหัสสินค้า"
    ]);
    exit;
}

$product_id = $data['product_id'];

$conn->begin_transaction();

try {

    // ลบรูปภาพก่อน (ถ้ามีตารางนี้)
    $conn->query("DELETE FROM product_images WHERE product_id = $product_id");

    // ลบสินค้า
    $stmt = $conn->prepare("DELETE FROM products WHERE product_id = ?");
    $stmt->bind_param("i", $product_id);
    $stmt->execute();

    $conn->commit();

    echo json_encode([
        "success" => true
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => "เกิดข้อผิดพลาด: " . $e->getMessage()
    ]);
}

$stmt->close();
$conn->close();
?>
