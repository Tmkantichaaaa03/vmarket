<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../includes/db_connect.php';

$seller_id = isset($_GET['seller_id']) ? intval($_GET['seller_id']) : 0;

if ($seller_id > 0) {
    // ดึงแจ้งเตือน 10 รายการล่าสุดของร้านนี้
    $sql = "SELECT * FROM notifications WHERE seller_id = $seller_id ORDER BY created_at DESC LIMIT 10";
    $result = $conn->query($sql);
    
    $notifications = [];
    $unread_count = 0;

    while ($row = $result->fetch_assoc()) {
        if ($row['is_read'] == 0) $unread_count++;
        $notifications[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $notifications,
        "unread_count" => $unread_count
    ]);
} else {
    echo json_encode(["success" => false, "message" => "ไม่พบรหัสผู้ขาย"]);
}
$conn->close();
?>