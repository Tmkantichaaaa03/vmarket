<?php
header("Content-Type: application/json");
include_once '../../config/db.php';
$data = json_decode(file_get_contents("php://input"));

try {
    $conn->beginTransaction();
    // อัปเดตสถานะล็อก
    $upd = $conn->prepare("UPDATE market_slots SET status = 'occupied' WHERE slot_id = ?");
    $upd->execute([$data->slot_id]);
    // บันทึกการจอง
    $ins = $conn->prepare("INSERT INTO bookings (seller_id, slot_id, shop_name_display) VALUES (?, ?, ?)");
    $ins->execute([$data->seller_id, $data->slot_id, $data->shop_name]);
    
    $conn->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}