<?php

error_reporting(E_ALL);
ini_set('display_errors', 1); 

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

include_once '../../includes/db_connect.php'; 

$product_id = isset($_GET['product_id']) ? (int)$_GET['product_id'] : null;

// Query หลัก: ดึงข้อมูลสินค้าและราคา/สต็อก
$where_clause = "";
if ($product_id) {
    // ใช้ quotes ครอบตัวแปรใน SQL Query เสมอ
    $where_clause = " WHERE p.product_id = '$product_id'";
}

$sql = "SELECT p.*, pv.price, pv.stock 
        FROM products p
        INNER JOIN product_variations pv ON p.product_id = pv.product_id"
        . $where_clause . 
        " ORDER BY p.created_at DESC";
        
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $products = array();
    while ($row = $result->fetch_assoc()) {
        $current_product_id = $row['product_id'];

        // ดึงรูปลายละเอียด (Detail Images) จากตาราง product_images
        $detail_images = [];
        
        // เพิ่ม Single Quotes รอบ $current_product_id ใน Query
        $sql_images = "SELECT image_url FROM product_images 
                       WHERE product_id = '$current_product_id' AND type = 'detail'";
        $result_images = $conn->query($sql_images);

        if ($result_images) { // ⚠️ ตรวจสอบเฉพาะความMสำเร็จของ Query
             while ($img_row = $result_images->fetch_assoc()) {
                $detail_images[] = $img_row['image_url'];
            }
        }
        
        // เพิ่ม Array ของรูปลายละเอียดเข้าใน Object สินค้าหลัก
        $row['detail_images'] = $detail_images;

        $products[] = $row;
    }
    
    http_response_code(200);
    echo json_encode(array("success" => true, "data" => $products));
    
} else {
    http_response_code(404);
    echo json_encode(array("success" => false, "message" => "No product found."));
}

$conn->close();
?>