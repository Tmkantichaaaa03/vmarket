<?php

// ⚠️ (ถ้าคุณยังพบ Error 500/400 อยู่ ให้เปิด Debugging ชั่วคราว)
// error_reporting(E_ALL);
// ini_set('display_errors', 1); 

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../includes/db_connect.php'; 

// กำหนดโฟลเดอร์สำหรับไฟล์ 3D (ต้องมีอยู่จริง)
$model_dir = "../../web_ui/assets/models/"; 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    
    // รับข้อมูลจาก $_POST (Text Fields ที่ถูกส่งมาจาก FormData)
    $product_id = isset($_POST['product_id']) ? (int)$_POST['product_id'] : null;
    $status = isset($_POST['status']) ? $conn->real_escape_string($_POST['status']) : null;
    $admin_notes = isset($_POST['admin_notes']) ? $conn->real_escape_string($_POST['admin_notes']) : null;

    // ตรวจสอบข้อมูลที่จำเป็น (product_id และ status)
    if (!$product_id || !$status) {
        http_response_code(400); 
        echo json_encode(array("success" => false, "message" => "Missing Product ID or Status field (400)."));
        exit;
    }
    
    // ตรวจสอบสถานะที่ถูกต้อง
    if (!in_array($status, ['approved', 'rejected'])) {
        http_response_code(400); 
        echo json_encode(array("success" => false, "message" => "Invalid status value provided (400)."));
        exit;
    }

    $model_3d_path = null;
    $model_update_query = ""; // ส่วนของ Query สำหรับอัปเดต model_3d
    
    // จัดการไฟล์ 3D (เฉพาะเมื่อสถานะเป็น 'approved')
    if ($status === 'approved') {
        
        // ตรวจสอบว่ามีการส่งไฟล์ 3D มาหรือไม่
        if (isset($_FILES['model_3d_file']) && $_FILES['model_3d_file']['error'] === UPLOAD_ERR_OK) {
             
            // บันทึกไฟล์ 3D
            $model_file_name = $_FILES['model_3d_file']['name'];
            $target_model_file = $model_dir . basename($model_file_name);
            
            if (move_uploaded_file($_FILES['model_3d_file']['tmp_name'], $target_model_file)) {
                $model_3d_path = $model_file_name;
                $model_update_query = ", model_3d = '$model_3d_path'"; // เตรียม Query
            } else {
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Failed to move 3D Model file. Check server permissions/path (500)."));
                exit;
            }
        } else {
            // ถ้าสถานะเป็น approved แต่ไม่มีไฟล์ 3D (ซึ่งจำเป็น)
            http_response_code(400); 
            echo json_encode(array("success" => false, "message" => "3D Model file is required for approval (400)."));
            exit;
        }
    }

    // สร้าง Query พื้นฐานสำหรับการอัปเดตสถานะและ Notes
    $sql = "UPDATE products SET 
            approval_status = '$status', 
            admin_notes = '$admin_notes' 
            $model_update_query 
            WHERE product_id = $product_id";

    if ($conn->query($sql)) {
        http_response_code(200);
        echo json_encode(array("success" => true, "message" => "Product ID $product_id status updated to $status."));
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Database update failed: " . $conn->error));
    }
    
} else {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>