<?php

header("Access-Control-Allow-Origin: *"); // อนุญาตให้เข้าถึงจากทุกโดเมน (สำหรับการทดสอบ)
header("Content-Type: application/json; charset=UTF-8"); // กำหนดรูปแบบการตอบกลับเป็น JSON
header("Access-Control-Allow-Methods: POST"); // กำหนดให้รับเฉพาะเมธอด POST เท่านั้น

include_once '../../includes/db_connect.php';

//ตรวจสอบเมธอดการร้องขอ
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    //รับข้อมูล JSON จาก Godot
    $data = json_decode(file_get_contents("php://input"));
    
    //ตรวจข้อมูลที่จำเป็น
    if (!isset($data->username) || !isset($data->email) || !isset($data->password)) {
        http_response_code(400); 
        echo json_encode(array("success" => false, "message" => "Missing required fields."));
        exit;
    }

    //ทำความสะอาดข้อมูล กันSQL Injection
    $username = $conn->real_escape_string($data->username);
    $email = $conn->real_escape_string($data->email);
    $password = $conn->real_escape_string($data->password);
    

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    //เริ่มdb transaction //เพื่อถ้าerrorข้อมูลจะไม่บันทึก
    $conn->begin_transaction();

    try {
        //dataหลักลง users
        $sql_user = "INSERT INTO users (username, email, password_hash, role) 
                     VALUES ('$username', '$email', '$password_hash', 'customer')";

        if (!$conn->query($sql_user)) {
             throw new Exception("User registration failed.");
        }

        $new_user_id = $conn->insert_id; //ดึงยูสไอดีที่สร้างขึ้นมา
        
        //dataเสริมลง customers
        $sql_customer = "INSERT INTO customers (user_id, name, game_points, level, avatar_id) 
                         VALUES ('$new_user_id', '$username', 0, 1, 1)"; //ใส่ค่าเริ่มต้น(game_points=0, level=1, avatar_id=1)
        
        if (!$conn->query($sql_customer)) {
            throw new Exception("Customer details insertion failed.");
        }
        
        $conn->commit();

        //json response successจ้า
        http_response_code(201);
        echo json_encode(array(
            "success" => true, 
            "message" => "Registration successful!",
            "user_id" => $new_user_id
        ));

    } catch (Exception $e) {

        $conn->rollback();
        
        //จัดการerror Username or Emailซ้ำ
        if ($conn->errno == 1062) { 
            http_response_code(409); 
            $message = "Username or Email already exists.";
        } else {
            http_response_code(500);
            $message = "Registration failed due to server error: " . $e->getMessage();
        }

        //json respones failedจ้า
        echo json_encode(array("success" => false, "message" => $message));
    }
    
} else {
    
    //ถ้าไม่ใช่เมธอด POSTให้ส่ง Errorกลับไป
    http_response_code(405); // 405 Method Not Allowed
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>