<?php
header('Content-Type: application/json');

$host = "localhost";
$user = "root";
$pass = "";
$db   = "virtual_marketplace";
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(['status' => 'error', 'message' => 'Connection failed']));
}


$seller_id = isset($_GET['seller_id']) ? intval($_GET['seller_id']) : 0;

if ($seller_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid or Missing Seller ID']);
    exit;
}

$sql_today = "SELECT SUM(oi.price * oi.quantity) as total 
              FROM order_items oi
              JOIN products p ON oi.product_id = p.product_id
              JOIN orders o ON oi.order_id = o.order_id
              WHERE p.seller_id = $seller_id 
              AND DATE(o.created_at) = CURDATE()
              AND o.status != 'cancelled'";
$res_today = $conn->query($sql_today);
$today_revenue = $res_today->fetch_assoc()['total'] ?? 0;

$sql_orders = "SELECT COUNT(DISTINCT oi.order_id) as count 
               FROM order_items oi
               JOIN products p ON oi.product_id = p.product_id
               WHERE p.seller_id = $seller_id";
$res_orders = $conn->query($sql_orders);
$total_orders = $res_orders->fetch_assoc()['count'] ?? 0;

$sql_trend = "SELECT DATE(o.created_at) as date, SUM(oi.price * oi.quantity) as daily_revenue 
              FROM order_items oi
              JOIN products p ON oi.product_id = p.product_id
              JOIN orders o ON oi.order_id = o.order_id
              WHERE p.seller_id = $seller_id 
              AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
              AND o.status != 'cancelled'
              GROUP BY DATE(o.created_at)
              ORDER BY date ASC";
$res_trend = $conn->query($sql_trend);

$chart_labels = [];
$chart_data = [];
while($row = $res_trend->fetch_assoc()) {
    $chart_labels[] = date('d M', strtotime($row['date']));
    $chart_data[] = (float)$row['daily_revenue'];
}

$sql_top = "SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.price * oi.quantity) as revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE p.seller_id = $seller_id
            GROUP BY p.product_id
            ORDER BY total_sold DESC LIMIT 5";
$res_top = $conn->query($sql_top);
$top_products = [];
while($row = $res_top->fetch_assoc()) {
    $top_products[] = $row;
}

echo json_encode([
    'status' => 'success',
    'today_revenue' => (float)$today_revenue,
    'total_orders' => (int)$total_orders,
    'chart_labels' => $chart_labels,
    'chart_data' => $chart_data,
    'top_products' => $top_products
]);
?>