<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../includes/db_connect.php'; 

// กำหนดโฟลเดอร์สำหรับไฟล์ 3D
$model_dir = "../../web_ui/assets/models/"; 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // รับข้อมูลจาก $_POST
    $product_id = isset($_POST['product_id']) ? (int)$_POST['product_id'] : null;
    $status = isset($_POST['status']) ? $conn->real_escape_string($_POST['status']) : null;
    $admin_notes = isset($_POST['admin_notes']) ? $conn->real_escape_string($_POST['admin_notes']) : null;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!$product_id || !$status) {
        http_response_code(400); 
        echo json_encode(array("success" => false, "message" => "Missing Product ID or Status field."));
        exit;
    }
    
    // ตรวจสอบสถานะที่ถูกต้อง
    if (!in_array($status, ['approved', 'rejected'])) {
        http_response_code(400); 
        echo json_encode(array("success" => false, "message" => "Invalid status value provided."));
        exit;
    }

    $model_3d_path = null;
    $model_update_query = ""; 
    
    // จัดการไฟล์ 3D (เฉพาะเมื่อสถานะเป็น 'approved')
    if ($status === 'approved') {
        if (isset($_FILES['model_3d_file']) && $_FILES['model_3d_file']['error'] === UPLOAD_ERR_OK) {
            $model_file_name = time() . '_' . $_FILES['model_3d_file']['name']; 
            $target_model_file = $model_dir . basename($model_file_name);
            
            if (move_uploaded_file($_FILES['model_3d_file']['tmp_name'], $target_model_file)) {
                $model_3d_path = $model_file_name;
                $model_update_query = ", model_3d = '$model_3d_path'"; 
            } else {
                http_response_code(500);
                echo json_encode(array("success" => false, "message" => "Failed to move 3D Model file."));
                exit;
            }
        } else {
            http_response_code(400); 
            echo json_encode(array("success" => false, "message" => "3D Model file is required for approval."));
            exit;
        }
    }

    // --- เริ่มต้นการบันทึกข้อมูล ---
    $sql = "UPDATE products SET 
            approval_status = '$status', 
            admin_notes = '$admin_notes' 
            $model_update_query 
            WHERE product_id = $product_id";

    if ($conn->query($sql)) {
        
       
        // ระบบส่งแจ้งเตือนไปที่หน้าร้านค้า
        
        $info_sql = "SELECT seller_id, name FROM products WHERE product_id = $product_id";
        $info_res = $conn->query($info_sql);
        
        if ($info_res && $info_res->num_rows > 0) {
            $row = $info_res->fetch_assoc();
            $seller_id = (int)$row['seller_id'];
            $p_name = $row['name'];

            if ($status === 'approved') {
                $title_text = "สินค้าได้รับอนุมัติแล้ว ✨";
                $message_text = "สินค้า '$p_name' ของคุณผ่านการตรวจสอบและออนไลน์แล้ว";
            } else {
                $title_text = "สินค้าถูกปฏิเสธ ❌";
                $message_text = "สินค้า '$p_name' ไม่ผ่านการอนุมัติ: $admin_notes";
            }

            $link_url = "edit_product.html?id=" . $product_id; 
            
            $safe_title = $conn->real_escape_string($title_text);
            $safe_message = $conn->real_escape_string($message_text);
            $safe_link = $conn->real_escape_string($link_url);

            $sql_noti = "INSERT INTO notifications (seller_id, title, message, link, is_read, created_at) 
                         VALUES ($seller_id, '$safe_title', '$safe_message', '$safe_link', 0, NOW())";
            
            $conn->query($sql_noti);
        }
    
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