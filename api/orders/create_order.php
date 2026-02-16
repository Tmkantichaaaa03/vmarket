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
    if (!isset($data->customer_id) || !isset($data->items) || !is_array($data->items) || empty($data->items)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Missing required order details (customer_id, items)."));
        exit;
    }
    
    // ทำความสะอาดข้อมูลหลัก
    $customer_id = (int)$data->customer_id;
    
    // ================= PAYMENT DATA =================
        $payment_status = "unpaid";
        $payment_slip = NULL;

        // ถ้ามีข้อมูลการชำระเงินส่งมา
        if (isset($data->payment_status)) {
            $payment_status = $conn->real_escape_string($data->payment_status);
        }

        if (isset($data->payment_slip) && !empty($data->payment_slip)) {
            $payment_slip = $conn->real_escape_string($data->payment_slip);
        }

    // เริ่ม Database Transaction เพื่อให้มั่นใจว่าข้อมูลจะถูกบันทึกทั้งหมดหรือยกเลิกทั้งหมด
    $conn->begin_transaction();

    try {
        $grand_total = 0; 
        $items_to_save = []; 

        // --- กระบวนการดึงราคาจากตาราง product_variations ตามโครงสร้างจริง ---
        foreach ($data->items as $item) {
            $product_id = (int)$item->product_id;
            $quantity = (int)$item->quantity;

            // ดึงราคาจากตาราง product_variations (เนื่องจากตาราง products ไม่มีฟิลด์ price)
            $sql_get_price = "SELECT price FROM product_variations WHERE product_id = $product_id LIMIT 1";
            $price_res = $conn->query($sql_get_price);

            if ($price_res && $price_res->num_rows > 0) {
                $product_data = $price_res->fetch_assoc();
                $current_price = (float)$product_data['price'];
                $subtotal = $current_price * $quantity;
                $grand_total += $subtotal;

                $items_to_save[] = [
                    'product_id' => $product_id,
                    'quantity' => $quantity,
                    'price' => $current_price,
                    'subtotal' => $subtotal
                ];
            } else {
                throw new Exception("Price not found for Product ID $product_id in product_variations table.");
            }
        }

        // บันทึกข้อมูลหลักลงในตาราง ORDERS
$sql_order = "INSERT INTO orders 
(customer_id, total_amount, status, payment_status, payment_slip)
VALUES 
(
    $customer_id, 
    $grand_total, 
    'รอการยืนยัน', 
    '$payment_status', 
    " . ($payment_slip ? "'$payment_slip'" : "NULL") . "
)";


        
        if (!$conn->query($sql_order)) {
             throw new Exception("Order header creation failed: " . $conn->error);
        }
        $new_order_id = $conn->insert_id; 
        
        // บันทึกข้อมูลรายละเอียดลงในตาราง ORDER_ITEMS (ใช้ LOOP)
        foreach ($items_to_save as $item) {
            
            $product_id = $item['product_id'];
            $quantity = $item['quantity'];
            $price = $item['price'];
            $subtotal = $item['subtotal'];

            // SQL INSERT สำหรับตาราง order_items
            $sql_item = "INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
                         VALUES ($new_order_id, $product_id, $quantity, $price, $subtotal)";

            if (!$conn->query($sql_item)) {
                throw new Exception("Order item insertion failed: " . $conn->error);
            }
        }
        
        // ยืนยันการทำ Transaction ทั้งหมด
        $conn->commit();

        // ส่งผลลัพธ์ความสำเร็จกลับไป
        http_response_code(201); 
        echo json_encode(array(
            "success" => true, 
            "message" => "Order placed successfully (ID: $new_order_id).",
            "order_id" => $new_order_id,
            "total_calculated" => $grand_total
        ));

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Order placement failed: " . $e->getMessage()));
    }
    
} else {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>