<?php

$servername = "localhost";
$username = "root";       
$password = "";           
$dbname = "virtual_marketplace";

$conn = new mysqli($servername, $username, $password, $dbname);

// ตรวจสอบการเชื่อมต่อ
if ($conn->connect_error) {
    // ถ้าเชื่อมต่อผิดพลาด ให้ส่งข้อความ JSON กลับไปทันที (สำคัญสำหรับ API)
    // การใช้ die(json_encode(...)) จะหยุดการทำงานของ PHP และส่ง JSON Error กลับไป
    die(json_encode(array("success" => false, "message" => "Connection failed: " . $conn->connect_error)));
}

// กำหนด Charset เป็น UTF-8 เพื่อรองรับภาษาไทย

$conn->set_charset("utf8mb4");

?>