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

    // --- ดึงข้อมูลลูกค้า ---
$sql_order = "SELECT 
                o.order_id, 
                o.total_amount, 
                o.status,
                o.payment_status,
                o.payment_slip,
                c.name AS customer_name, 
                c.phone_number, 
                c.address, 
                c.city, 
                c.postal_code
              FROM orders o
              INNER JOIN customers c ON o.customer_id = c.customer_id
              WHERE o.order_id = $order_id";
    
    $result_order = $conn->query($sql_order);
    if (!$result_order) {
        die(json_encode(array("success" => false, "message" => "SQL Error (Order): " . $conn->error)));
    }
    $order_info = $result_order->fetch_assoc();

    if ($order_info) {
        // Query: ดึงรายละเอียดรายการสินค้าใน order_items โดย JOIN กับ products เพื่อดึงชื่อสินค้า
        // หมายเหตุ: ใช้ p.name ตามโครงสร้างจริงใน virtual_marketplace (1).sql
        $sql = "SELECT 
                    oi.product_id, 
                    p.name AS product_name, 
                    oi.quantity, 
                    oi.price, 
                    oi.subtotal
                FROM order_items oi
                INNER JOIN products p ON oi.product_id = p.product_id
                WHERE oi.order_id = $order_id";

        $result = $conn->query($sql);
        if (!$result) {
            die(json_encode(array("success" => false, "message" => "SQL Error (Items): " . $conn->error)));
        }

        $items_array = array();
        while($row = $result->fetch_assoc()) {
            array_push($items_array, array(
                "product_id" => $row['product_id'],
                "product_name" => $row['product_name'],
                "quantity" => $row['quantity'],
                "price" => $row['price'], // ปรับจาก unit_price เป็น price ให้ตรงกับ JS
                "subtotal" => $row['subtotal']
            ));
        }

        $order_info['items'] = $items_array;

        // ส่งผลลัพธ์ความสำเร็จกลับไป
        http_response_code(200); // 200 OK
        echo json_encode(array(
            "success" => true, 
            "message" => "Order details retrieved successfully for order ID $order_id.",
            "data" => $order_info
        ));

    } else {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "No order found for this ID."));
    }
    
} else {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>