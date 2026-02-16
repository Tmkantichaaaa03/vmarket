<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// เรียกใช้ไฟล์เชื่อมต่อฐานข้อมูล
include_once '../../includes/db_connect.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // ตรวจสอบว่ามี seller_id ถูกส่งมาใน URL หรือไม่
    if (!isset($_GET['seller_id'])) {
        http_response_code(400); 
        echo json_encode(array("success" => false, "message" => "Missing seller_id parameter."));
        exit;
    }
    
    $seller_id = (int)$_GET['seller_id']; 
    
    // Query ที่ซับซ้อน: ดึงคำสั่งซื้อทั้งหมดที่เกี่ยวข้องกับสินค้าที่มาจาก seller_id นี้
    // ต้อง Group by order_id เพื่อไม่ให้คำสั่งซื้อซ้ำซ้อนกันในรายการหลัก
$sql = "SELECT 
            o.order_id, 
            o.total_amount, 
            o.status, 
            o.created_at,
            o.payment_status,
            o.payment_slip,
            COUNT(oi.item_id) AS total_items_count
        FROM orders o
        INNER JOIN order_items oi ON o.order_id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.product_id
        WHERE p.seller_id = $seller_id
        GROUP BY o.order_id
        ORDER BY o.created_at DESC";


    $result = $conn->query($sql);
    $orders_array = array();

    if ($result && $result->num_rows > 0) {
        
        while($row = $result->fetch_assoc()) {
            
            // วนลูปดึงข้อมูลคำสั่งซื้อหลัก
array_push($orders_array, array(
    "order_id" => $row['order_id'],
    "total_amount" => $row['total_amount'],
    "status" => $row['status'],
    "created_at" => $row['created_at'],
    "payment_status" => $row['payment_status'],
    "payment_slip" => $row['payment_slip'],
    "total_items_count" => $row['total_items_count']
));

        }

        // ส่งผลลัพธ์ความสำเร็จกลับไป
        http_response_code(200); 
        echo json_encode(array(
            "success" => true, 
            "message" => "Orders retrieved successfully for seller ID $seller_id.",
            "data" => $orders_array
        ));

    } else {
        // ไม่พบคำสั่งซื้อ
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "No orders found for this seller."));
    }
    
} else {
    // จัดการกรณี Method ไม่ถูกต้อง (405)
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>