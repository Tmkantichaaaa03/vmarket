<?php

// หน้าที่: ดึงรายละเอียดสินค้าทั้งหมดภายในคำสั่งซื้อเดียว (สำหรับ Seller Panel)

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// เรียกใช้ไฟล์เชื่อมต่อฐานข้อมูล
include_once '../../includes/db_connect.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // ตรวจสอบว่ามี order_id ถูกส่งมาใน URL หรือไม่
    if (!isset($_GET['order_id'])) {
        http_response_code(400); // 400 Bad Request
        echo json_encode(array("success" => false, "message" => "Missing order_id parameter."));
        exit;
    }
    
    $order_id = (int)$_GET['order_id']; 
    
    // Query: ดึงรายละเอียดรายการสินค้าใน order_items โดย JOIN กับ products เพื่อดึงชื่อสินค้า
    $sql = "SELECT 
                oi.product_id, 
                p.name AS product_name, 
                oi.quantity, 
                oi.price AS unit_price, 
                oi.subtotal
            FROM order_items oi
            INNER JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = $order_id";

    $result = $conn->query($sql);
    $items_array = array();

    if ($result && $result->num_rows > 0) {
        
        while($row = $result->fetch_assoc()) {
            
            // วนลูปดึงข้อมูลรายการสินค้า
            array_push($items_array, array(
                "product_id" => $row['product_id'],
                "product_name" => $row['product_name'],
                "quantity" => $row['quantity'],
                "unit_price" => $row['unit_price'],
                "subtotal" => $row['subtotal']
            ));
        }

        // ส่งผลลัพธ์ความสำเร็จกลับไป
        http_response_code(200); // 200 OK
        echo json_encode(array(
            "success" => true, 
            "message" => "Order details retrieved successfully for order ID $order_id.",
            "data" => $items_array
        ));

    } else {
        // ไม่พบรายละเอียดสินค้า
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "No items found for this order ID."));
    }
    
} else {
    // จัดการกรณี Method ไม่ถูกต้อง (405)
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>