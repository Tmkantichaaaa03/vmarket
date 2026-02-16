<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../includes/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // รับค่าและป้องกัน SQL Injection
    $seller_id = intval($_POST['seller_id']);
    $shop_name = $conn->real_escape_string($_POST['shop_name']);
    $phone     = $conn->real_escape_string($_POST['phone_number']);
    $address   = $conn->real_escape_string($_POST['address']);
    $city      = $conn->real_escape_string($_POST['city']);
    $postal    = $conn->real_escape_string($_POST['postal_code']);
    $desc      = $conn->real_escape_string($_POST['description']);

    // สร้างคำสั่ง SQL พื้นฐาน
    $sql = "UPDATE sellers SET 
            shop_name = '$shop_name', 
            phone_number = '$phone', 
            address = '$address', 
            city = '$city', 
            postal_code = '$postal', 
            description = '$desc'";

    // ตรวจสอบการอัปโหลดรูปภาพ
    if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === 0) {
        $img_name = time() . '_' . basename($_FILES['profile_image']['name']);
        $target_dir = "../../assets/images/shops/";

        // สร้างโฟลเดอร์ถ้ายังไม่มี
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $target_dir . $img_name)) {
            $sql .= ", profile_image = '$img_name'";
        }
    }

    $sql .= " WHERE seller_id = $seller_id";

    if ($conn->query($sql)) {
        echo json_encode(["success" => true, "message" => "อัปเดตโปรไฟล์สำเร็จ"]);
    } else {
        echo json_encode(["success" => false, "message" => "เกิดข้อผิดพลาด: " . $conn->error]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}

$conn->close();
?>