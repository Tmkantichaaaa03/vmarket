<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../includes/db_connect.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->username) || !isset($data->password)) {
        http_response_code(400); 
        echo json_encode(array("success" => false, "message" => "Missing username or password."));
        exit;
    }

    $username = $conn->real_escape_string($data->username);
    $password = $conn->real_escape_string($data->password);
    
    $sql = "SELECT u.user_id, u.password_hash,
                   s.seller_id, s.shop_name, s.address
            FROM users u
            INNER JOIN sellers s ON u.user_id = s.user_id
            WHERE u.username = '$username' AND u.role = 'seller'
            LIMIT 1";
            

    $result = $conn->query($sql);

    if ($result->num_rows == 1) {
        $row = $result->fetch_assoc();
        
        if (password_verify($password, $row['password_hash'])) {
            
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Login successful.",
                "user_data" => array(
                    "user_id" => $row['user_id'],
                    "username" => $username,
                    "seller_id" => $row['seller_id'],
                    "shop_name" => $row['shop_name'],
                    "address" => $row['address']
                )
            ));
            
        } else {
            http_response_code(401);
            echo json_encode(array("success" => false, "message" => "Invalid password."));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "Username not found or user is not a seller.")); 
    }
    
} else {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>