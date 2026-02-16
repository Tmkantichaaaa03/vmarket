<?php
// ไฟล์สำหรับดึงรูปภาพประกอบ (Gallery) ของสินค้า
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

include_once '../../includes/db_connect.php';

if (isset($_GET['product_id'])) {
    $product_id = (int)$_GET['product_id'];

    // ดึงข้อมูลจากตาราง product_images ตาม product_id
    $sql = "SELECT image_url FROM product_images WHERE product_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $product_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $images = array();
    while ($row = $result->fetch_assoc()) {
        $images[] = $row;
    }

    echo json_encode(array(
        "success" => true,
        "data" => $images
    ));
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "ไม่พบรหัสสินค้า (product_id)"));
}

$conn->close();
?>