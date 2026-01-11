<?php

// ไว้ดึงรายการสินค้าทั้งหมดที่มีสถานะ 'pending' (สำหรับ Admin Panel)

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");


include_once '../../includes/db_connect.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // เตรียม Query เพื่อดึงข้อมูลสินค้าทั้งหมดที่มีสถานะเป็น 'pending'
    // ใช้ JOIN ตาราง sellers และ product_variations เพื่อดึงข้อมูลที่จำเป็นมาตรวจสอบ
    $sql = "SELECT p.product_id, p.name AS product_name, p.description, 
                   s.shop_name, s.address AS shop_address, 
                   pv.price, pv.stock
            FROM products p
            INNER JOIN sellers s ON p.seller_id = s.seller_id
            INNER JOIN product_variations pv ON p.product_id = pv.product_id
            WHERE p.approval_status = 'pending'
            ORDER BY p.created_at ASC";

    $result = $conn->query($sql);
    $products_array = array();

    if ($result && $result->num_rows > 0) {
        
        while($row = $result->fetch_assoc()) {
            
            array_push($products_array, array(
                "product_id" => $row['product_id'],
                "product_name" => $row['product_name'],
                "description" => $row['description'],
                "shop_name" => $row['shop_name'],
                "shop_address" => $row['shop_address'],
                "price" => $row['price'],
                "stock" => $row['stock'],
                "status" => "pending" // ยืนยันสถานะ
            ));
        }

        // ส่งผลลัพธ์ความสำเร็จกลับไป
        http_response_code(200);
        echo json_encode(array(
            "success" => true, 
            "message" => "Pending products retrieved successfully.",
            "data" => $products_array
        ));

    } else {
        // ไม่พบสินค้าที่รอดำเนินการ
        http_response_code(404); // 404 Not Found
        echo json_encode(array("success" => false, "message" => "No pending products found."));
    }
    
} else {
    // จัดการกรณี Method ไม่ถูกต้อง (ไม่ใช่ GET)
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>