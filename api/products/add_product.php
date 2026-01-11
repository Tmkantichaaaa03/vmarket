<?php

// ⚠️ เปิด Debugging ชั่วคราว เพื่อให้ PHP Error แสดงผลเป็นข้อความชัดเจน
error_reporting(E_ALL);
ini_set('display_errors', 1); 

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../includes/db_connect.php'; 

// กำหนดโฟลเดอร์สำหรับอัปโหลด (ต้องมีอยู่จริง)
$upload_dir = "../../web_ui/seller_panel/assets/images/"; 
$model_dir = "../../web_ui/assets/models/"; 


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // 1. รับข้อมูลจาก $_POST (Text Fields)
    $seller_id = isset($_POST['seller_id']) ? (int)$_POST['seller_id'] : null;
    $name = isset($_POST['product_name']) ? $conn->real_escape_string($_POST['product_name']) : null;
    $description = isset($_POST['description']) ? $conn->real_escape_string($_POST['description']) : null;
    $price = isset($_POST['price']) ? (float)$_POST['price'] : null;
    $stock = isset($_POST['stock']) ? (int)$_POST['stock'] : null;

    if (!$seller_id || !$name || !$price || !$stock || !isset($_FILES['cover_image'])) {
        http_response_code(400); 
        echo json_encode(array("success" => false, "message" => "Missing required fields or cover image."));
        exit;
    }

    // 2. จัดการ Cover Image (รูปปก)
    $cover_image_path = null;
    $cover_file_name = $_FILES['cover_image']['name'];
    $target_file = $upload_dir . basename($cover_file_name);
    
    // ตรวจสอบ Error ของไฟล์ Cover Image
    if ($_FILES['cover_image']['error'] !== UPLOAD_ERR_OK) {
         http_response_code(500);
         echo json_encode(array("success" => false, "message" => "Cover image upload error: " . $_FILES['cover_image']['error']));
         exit;
    }
    
    if (move_uploaded_file($_FILES['cover_image']['tmp_name'], $target_file)) {
        $cover_image_path = $cover_file_name;
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Failed to move uploaded cover image file. Check permissions/path."));
        exit;
    }

    // 3. จัดการ Optional 3D Model File
    $model_3d_path = null;
    // ✅ แก้ไข: ตรวจสอบ key ใน $_FILES และ Error code
    if (isset($_FILES['model_3d_file']) && $_FILES['model_3d_file']['error'] === UPLOAD_ERR_OK) {
        $model_file_name = $_FILES['model_3d_file']['name'];
        $target_model_file = $model_dir . basename($model_file_name);
        
        if (move_uploaded_file($_FILES['model_3d_file']['tmp_name'], $target_model_file)) {
            $model_3d_path = $model_file_name;
        }
    }

    // 4. Query INSERT หลักเข้าตาราง products
    $sql = "INSERT INTO products (seller_id, name, description, image, model_3d, approval_status)
            VALUES ($seller_id, '$name', '$description', '$cover_image_path', '$model_3d_path', 'pending')";
    
    if ($conn->query($sql)) {
        
        $new_product_id = $conn->insert_id; // ได้ Product ID ใหม่
        $image_success = true;

        // 5. จัดการ Detail Images: INSERT เข้าตาราง product_images
        // ✅ แก้ไข: ตรวจสอบ key ว่ามีอยู่จริงและเป็น Array 
        if (isset($_FILES['detail_images']) && is_array($_FILES['detail_images']['name'])) { 

            // ⚠️ ใช้ $key => $filename สำหรับการเข้าถึง Array
            foreach ($_FILES['detail_images']['name'] as $key => $filename) {
                
                // ตรวจสอบว่าไฟล์ถูกส่งมาสำเร็จและไม่มี Error ก่อนดำเนินการต่อ
                if ($_FILES['detail_images']['error'][$key] === UPLOAD_ERR_OK) {
                    $tmp_name = $_FILES['detail_images']['tmp_name'][$key];
                    $target_detail_file = $upload_dir . basename($filename);
                    
                    if (move_uploaded_file($tmp_name, $target_detail_file)) {
                        // บันทึกรายละเอียดรูปภาพลงในตาราง product_images
                        $sql_img = "INSERT INTO product_images (product_id, image_url, type)
                                     VALUES ($new_product_id, '$filename', 'detail')";
                        if (!$conn->query($sql_img)) {
                            $image_success = false;
                            break; 
                        }
                    } else {
                        
                    }
                }
            }
        }
        
        // 6. แทรกข้อมูลราคา/สต็อกลงในตาราง product_variations
        $sql_variation = "INSERT INTO product_variations (product_id, price, stock)
                          VALUES ($new_product_id, $price, $stock)";
                          
        if ($conn->query($sql_variation) && $image_success) {
            http_response_code(201);
            echo json_encode(array("success" => true, "message" => "Product submitted successfully with files.", "product_id" => $new_product_id));
        } else {
            // Rollback หรือแจ้ง Error
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Product submitted, but detail images/variation failed: " . $conn->error));
        }
        
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Database submission failed: " . $conn->error));
    }
    
} else {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>