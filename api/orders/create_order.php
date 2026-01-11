<?php

// หน้าที่: บันทึกคำสั่งซื้อใหม่จากตะกร้าสินค้า (Core E-commerce Function)


header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// เรียกใช้ไฟล์เชื่อมต่อฐานข้อมูล
include_once '../../includes/db_connect.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // รับข้อมูล JSON จาก Godot (ข้อมูลตะกร้าสินค้า)
    $data = json_decode(file_get_contents("php://input"));
    
    // ตรวจสอบข้อมูลหลักที่จำเป็น: customer_id, total_amount, และต้องมี items ที่เป็น Array ไม่ว่าง
    if (!isset($data->customer_id) || !isset($data->total_amount) || !isset($data->items) || !is_array($data->items) || empty($data->items)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Missing required order details (customer_id, total_amount, items)."));
        exit;
    }
    
    // ทำความสะอาดข้อมูลหลัก
    $customer_id = (int)$data->customer_id;
    $total_amount = (float)$data->total_amount;
    
    // เริ่ม Database Transaction เพื่อให้มั่นใจว่าข้อมูลจะถูกบันทึกทั้งหมดหรือยกเลิกทั้งหมด
    $conn->begin_transaction();

    try {
        // บันทึกข้อมูลหลักลงในตาราง ORDERS 
        // กำหนด status เป็น 'pending' (เนื่องจากใช้ Cash on Delivery - COD)
        $sql_order = "INSERT INTO orders (customer_id, total_amount, status) 
                      VALUES ($customer_id, $total_amount, 'pending')";
        
        if (!$conn->query($sql_order)) {
             throw new Exception("Order header creation failed.");
        }
        $new_order_id = $conn->insert_id; // ดึง ID คำสั่งซื้อที่สร้างขึ้นมาเพื่อใช้ในตารางถัดไป
        
        // บันทึกข้อมูลรายละเอียดลงในตาราง ORDER_ITEMS (ใช้ LOOP) 
        foreach ($data->items as $item) {
            
            // ตรวจสอบความครบถ้วนของข้อมูลแต่ละรายการ
            if (!isset($item->product_id) || !isset($item->quantity) || !isset($item->price)) {
                 throw new Exception("One or more items are missing product_id, quantity, or price.");
            }
            
            // ทำความสะอาดข้อมูล Item
            $product_id = (int)$item->product_id;
            $quantity = (int)$item->quantity;
            $price = (float)$item->price;

            // คำนวณ Subtotal ของสินค้าชิ้นนั้น
            $subtotal = $quantity * $price;
            
            // SQL INSERT สำหรับตาราง order_items (รายละเอียดสินค้าแต่ละชิ้น)
            $sql_item = "INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
                         VALUES ($new_order_id, $product_id, $quantity, $price, $subtotal)";

            if (!$conn->query($sql_item)) {
                throw new Exception("Order item insertion failed.");
            }
        }
        
        // ยืนยันการทำ Transaction ทั้งหมด
        $conn->commit();

        // ส่งผลลัพธ์ความสำเร็จกลับไป
        http_response_code(201); // 201 Created
        echo json_encode(array(
            "success" => true, 
            "message" => "Order placed successfully (ID: $new_order_id).",
            "order_id" => $new_order_id
        ));

    } catch (Exception $e) {
        // จัดการข้อผิดพลาด: ยกเลิกการเปลี่ยนแปลงทั้งหมด และส่ง Error กลับไป
        $conn->rollback();
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Order placement failed: " . $e->getMessage()));
    }
    
} else {
    // จัดการกรณี Method ไม่ถูกต้อง (405)
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>