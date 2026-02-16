<?php
header("Content-Type: application/json");

// เชื่อมต่อฐานข้อมูล
$conn = new mysqli("localhost", "root", "", "virtual_marketplace");

// ตรวจสอบการเชื่อมต่อ
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "เชื่อมต่อฐานข้อมูลไม่สำเร็จ"
    ]);
    exit;
}

// ดึงข้อมูล stall ทั้งหมด
$sql = "SELECT stall_id, stall_number, zone, price, status, seller_id 
        FROM market_stalls";

$result = $conn->query($sql);

$stalls = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $stalls[] = $row;
    }
}

// ส่ง JSON กลับ
echo json_encode($stalls);

$conn->close();
?>
