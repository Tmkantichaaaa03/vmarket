<?php
// ไฟล์สำหรับดึงรายการสินค้าทั้งหมดของผู้ขาย (สำหรับ Seller Panel)

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// เชื่อมต่อฐานข้อมูล
include_once '../../includes/db_connect.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // รับ seller_id จาก URL Parameter ($_GET)
    if (!isset($_GET['seller_id'])) {
        http_response_code(400); // 400 Bad Request
        echo json_encode(array("success" => false, "message" => "Missing seller_id parameter."));
        exit;
    }
    
    // ทำความสะอาดข้อมูลเพื่อความปลอดภัย
    $seller_id = (int)$_GET['seller_id']; 
    
    // เตรียม Query เพื่อดึงสินค้าทั้งหมดของ Seller รายนี้
    // จุดแก้ไข: เพิ่ม p.image เข้าไปในคำสั่ง SELECT เพื่อให้ API ส่งชื่อไฟล์รูปภาพออกไป
    $sql = "SELECT p.product_id, p.name, p.description, p.image, p.approval_status,
                   pv.price, pv.stock
            FROM products p
            INNER JOIN product_variations pv ON p.product_id = pv.product_id
            WHERE p.seller_id = $seller_id
            ORDER BY p.product_id DESC";

    $result = $conn->query($sql);
    $products_array = array();

    if ($result && $result->num_rows > 0) {
        // วนลูปดึงข้อมูลและเก็บใน Array
        while($row = $result->fetch_assoc()) {
            
            array_push($products_array, array(
                "product_id" => $row['product_id'],
                "name" => $row['name'],
                "description" => $row['description'],
                "image" => $row['image'], // จุดแก้ไข: เพิ่มการเก็บข้อมูล image ลงใน Array
                "price" => $row['price'],
                "stock" => $row['stock'],
                "approval_status" => $row['approval_status'] // แสดงสถานะให้ผู้ขายเห็น
            ));
        }

        // ส่งข้อมูลกลับเป็น JSON
        http_response_code(200);
        echo json_encode(array(
            "success" => true, 
            "message" => "Products retrieved successfully.",
            "data" => $products_array
        ));

    } else {
        // กรณีไม่พบสินค้าสำหรับผู้ขายรายนี้
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "No products found for this seller."));
    }
    
} else {
    // จัดการกรณี Method ไม่ถูกต้อง (ไม่ใช่ GET)
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>