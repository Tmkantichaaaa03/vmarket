<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once '../../includes/db_connect.php'; 

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->order_id) && !empty($data->status)) {

    $order_id = intval($data->order_id);
    $new_status = "";

    if ($data->status === 'confirmed') {
        $new_status = "กำลังจัดส่ง";
    } 
    else if ($data->status === 'cancelled') {
        $new_status = "ยกเลิกออเดอร์";
    }
    else if ($data->status === 'completed') {   // ✅ แก้ตรงนี้
        $new_status = "จัดส่งสำเร็จ";
    }

    if ($new_status === "") {
        echo json_encode(array(
            "success" => false,
            "message" => "สถานะไม่ถูกต้อง"
        ));
        exit;
    }

    $sql = "UPDATE orders SET status = '$new_status' WHERE order_id = $order_id";

    if ($conn->query($sql)) {
        echo json_encode(array(
            "success" => true,
            "message" => "เปลี่ยนสถานะเป็น $new_status แล้ว"
        ));
    } else {
        echo json_encode(array(
            "success" => false,
            "message" => $conn->error
        ));
    }

} else {
    echo json_encode(array(
        "success" => false,
        "message" => "ข้อมูลไม่ครบ"
    ));
}

$conn->close();
?>
