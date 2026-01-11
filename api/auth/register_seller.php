<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once '../../includes/db_connect.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->username) || !isset($data->email) || !isset($data->password) || !isset($data->shop_name) || !isset($data->address)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Missing required fields (username, email, password, shop_name, address)."));
        exit;
    }

    $username = $conn->real_escape_string($data->username);
    $email = $conn->real_escape_string($data->email);
    $password = $conn->real_escape_string($data->password);
    $shop_name = $conn->real_escape_string($data->shop_name);
    $address = $conn->real_escape_string($data->address);
    
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $conn->begin_transaction();

    try {
        
        $sql_user = "INSERT INTO users (username, email, password_hash, role) 
                     VALUES ('$username', '$email', '$password_hash', 'seller')";

        if (!$conn->query($sql_user)) {
             throw new Exception("User registration failed.");
        }

        $new_user_id = $conn->insert_id; 
        
        $sql_seller = "INSERT INTO sellers (user_id, shop_name, address) 
                         VALUES ('$new_user_id', '$shop_name', '$address')";
        
        if (!$conn->query($sql_seller)) {
            throw new Exception("Seller details insertion failed.");
        }
        
        $conn->commit();

        http_response_code(201);
        echo json_encode(array(
            "success" => true, 
            "message" => "Seller registration successful!",
            "user_id" => $new_user_id
        ));

    } catch (Exception $e) {
        
        $conn->rollback();
        
        if ($conn->errno == 1062) { 
            http_response_code(409); 
            $message = "Username or Email already exists.";
        } else {
            http_response_code(500);
            $message = "Registration failed due to server error: " . $e->getMessage();
        }

        echo json_encode(array("success" => false, "message" => $message));
    }
    
} else {
    
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}

$conn->close();
?>