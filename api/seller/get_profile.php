<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../includes/db_connect.php'; 

$seller_id = isset($_GET['seller_id']) ? intval($_GET['seller_id']) : 0;

if ($seller_id > 0) {
    // ดึงข้อมูลทุกฟิลด์รวมถึง description ที่เพิ่งเพิ่ม
    $sql = "SELECT shop_name, phone_number, address, city, postal_code, description, profile_image 
        FROM sellers WHERE seller_id = $seller_id";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $data = $result->fetch_assoc();
        echo json_encode(["success" => true, "data" => $data]);
    } else {
        echo json_encode(["success" => false, "message" => "ไม่พบข้อมูล ID: " . $seller_id]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Seller ID ไม่ถูกต้อง"]);
}
$conn->close();
?>