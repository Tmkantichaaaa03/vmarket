<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include_once '../../includes/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents("php://input"));

    $stall_id = isset($data->stall_id) ? (int)$data->stall_id : 0;
    $seller_id = isset($data->seller_id) ? (int)$data->seller_id : 0;

    if ($stall_id <= 0 || $seller_id <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ข้อมูลไม่ครบ"]);
        exit;
    }

    $conn->begin_transaction();

    try {

        // เช็คก่อนว่าพื้นที่ว่างไหม
        $check = $conn->prepare("SELECT status FROM market_stalls WHERE stall_id = ?");
        $check->bind_param("i", $stall_id);
        $check->execute();
        $result = $check->get_result()->fetch_assoc();

        if ($result['status'] !== 'available') {
            throw new Exception("พื้นที่นี้ถูกจองแล้ว");
        }

        // อัปเดตสถานะ
        $stmt = $conn->prepare("UPDATE market_stalls 
                                SET status='booked', seller_id=? 
                                WHERE stall_id=?");

        $stmt->bind_param("ii", $seller_id, $stall_id);
        $stmt->execute();

        $conn->commit();

        echo json_encode([
            "success" => true,
            "message" => "จองสำเร็จ"
        ]);

    } catch (Exception $e) {

        $conn->rollback();

        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }

} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}

$conn->close();
?>
