<?php

declare(strict_types=1);

use App\Core\Database;

require_once __DIR__ . '/../src/Core/bootstrap.php';
load_env(__DIR__ . '/../.env');

function build_slug(string $name, int $id): string
{
    $slug = strtolower($name);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    if ($slug === '') {
        $slug = 'product';
    }

    return sprintf('%s-%d', $slug, $id);
}

function load_products_from_frontend(): array
{
    $productFile = realpath(__DIR__ . '/../../Medical_Product/src/components/ProductList/ProductList.js');
    if ($productFile === false) {
        return [];
    }

    $source = file_get_contents($productFile);
    if ($source === false) {
        return [];
    }

    $pattern = '/\{\s*id:\s*(\d+),\s*name:\s*([\'"])(.*?)\2,\s*price:\s*(\d+),\s*category:\s*([\'"])(.*?)\5,\s*image:\s*[^}]+\}/s';
    preg_match_all($pattern, $source, $matches, PREG_SET_ORDER);

    $rows = [];
    foreach ($matches as $match) {
        $id = (int) $match[1];
        $name = trim((string) $match[3]);
        $price = (int) $match[4];
        $category = trim((string) $match[6]);

        if ($id <= 0 || $name === '' || $price <= 0 || $category === '') {
            continue;
        }

        $seedStock = (($id * 11) % 250) + 15;
        if (strtolower($name) === strtolower('Oral Rehydration Salts (ORS)')) {
            $seedStock = 0;
        }

        $rows[] = [
            'id' => $id,
            'name' => $name,
            'slug' => build_slug($name, $id),
            'category' => $category,
            'price_ks' => $price,
            'stock' => $seedStock,
            'image_url' => null,
            'description' => 'Seeded from frontend catalog',
        ];
    }

    usort($rows, static fn (array $a, array $b): int => $a['id'] <=> $b['id']);
    return $rows;
}

$db = Database::connection();
$driver = (string) $db->getAttribute(PDO::ATTR_DRIVER_NAME);

$schemaFile = $driver === 'sqlite'
    ? __DIR__ . '/../database/schema.sqlite.sql'
    : __DIR__ . '/../database/schema.sql';

$schema = file_get_contents($schemaFile);
if ($schema === false) {
    throw new RuntimeException(basename($schemaFile) . ' not found');
}

$db->exec($schema);

$tables = ['deliveries', 'order_items', 'orders', 'cart_items', 'inventory_items', 'reviews', 'inquiries', 'products', 'customers', 'users'];

if ($driver === 'mysql') {
    $db->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach ($tables as $table) {
        $db->exec("TRUNCATE TABLE {$table}");
    }
    $db->exec('SET FOREIGN_KEY_CHECKS=1');
} else {
    foreach ($tables as $table) {
        $db->exec("DELETE FROM {$table}");
    }

    // Reset SQLite autoincrement counters for deterministic IDs.
    $db->exec("DELETE FROM sqlite_sequence WHERE name IN ('users','products','inventory_items','customers','cart_items','orders','order_items','deliveries','reviews','inquiries')");
}

$userStmt = $db->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password_hash, :role)');
$users = [
    ['Admin User', 'admin@medical.local', 'admin123', 'admin'],
    ['Staff User', 'staff@medical.local', 'staff123', 'staff'],
    ['Customer Demo', 'customer@medical.local', 'customer123', 'customer'],
];

foreach ($users as [$name, $email, $password, $role]) {
    $userStmt->execute([
        'name' => $name,
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_BCRYPT),
        'role' => $role,
    ]);
}

$productStmt = $db->prepare('INSERT INTO products (id, name, slug, category, price_ks, stock, image_url, description) VALUES (:id, :name, :slug, :category, :price_ks, :stock, :image_url, :description)');
$products = load_products_from_frontend();

if ($products === []) {
    throw new RuntimeException('Failed to load products from frontend ProductList.js');
}

$productIdsBySlug = [];

foreach ($products as $row) {
    $productStmt->execute([
        'id' => $row['id'],
        'name' => $row['name'],
        'slug' => $row['slug'],
        'category' => $row['category'],
        'price_ks' => $row['price_ks'],
        'stock' => $row['stock'],
        'image_url' => $row['image_url'],
        'description' => $row['description'],
    ]);

    $productIdsBySlug[$row['slug']] = (int) $row['id'];
}

$invStmt = $db->prepare('INSERT INTO inventory_items (product_id, name, sku, category, stock, total_stock, price_ks, status) VALUES (:product_id, :name, :sku, :category, :stock, :total_stock, :price_ks, :status)');
foreach ($products as $row) {
    $stock = (int) $row['stock'];
    $total = $stock + (int) (($row['id'] * 13) % 120);
    $status = $stock <= 0 ? 'expired' : ($stock < 25 ? 'low' : 'normal');
    $invStmt->execute([
        'product_id' => $row['id'],
        'name' => $row['name'],
        'sku' => sprintf('MED-%04d', $row['id']),
        'category' => $row['category'],
        'stock' => $stock,
        'total_stock' => $total,
        'price_ks' => (int) $row['price_ks'],
        'status' => $status,
    ]);
}

$customerStmt = $db->prepare('INSERT INTO customers (user_id, code, name, email, type, role_label, last_activity) VALUES (:user_id, :code, :name, :email, :type, :role_label, :last_activity)');
$customerRows = [
    [3, 'MED-9821', 'Customer Demo', 'customer@medical.local', 'customers', 'Premium Customer', '2 hours ago'],
    [null, 'MED-4422', 'Robert Brown', 'robert@email.com', 'customers', 'Standard Customer', 'Yesterday'],
    [1, 'STAFF-001', 'Admin User', 'admin@medical.local', 'staff', 'Super Admin', 'Active Now'],
    [2, 'STAFF-002', 'Staff User', 'staff@medical.local', 'staff', 'Logistics Manager', '15 mins ago'],
];

foreach ($customerRows as [$userId, $code, $name, $email, $type, $roleLabel, $activity]) {
    $customerStmt->execute([
        'user_id' => $userId,
        'code' => $code,
        'name' => $name,
        'email' => $email,
        'type' => $type,
        'role_label' => $roleLabel,
        'last_activity' => $activity,
    ]);
}

$reviewStmt = $db->prepare('INSERT INTO reviews (name, email, rating, title, comment, status) VALUES (:name, :email, :rating, :title, :comment, :status)');
$reviewRows = [
    ['Aung Min', 'aung.min@example.com', 5, 'Fast and reliable', 'My order arrived quickly and all items were sealed and fresh.', 'published'],
    ['Mya Thandar', 'mya.thandar@example.com', 4, 'Good service', 'Easy checkout and responsive support. Will order again.', 'published'],
    ['Ko Zeya', 'ko.zeya@example.com', 5, 'Great quality', 'The products were exactly as described and packaging was safe.', 'published'],
    ['Nilar Win', 'nilar.win@example.com', 4, 'Smooth experience', 'Website was easy to use and delivery tracking was helpful.', 'published'],
    ['Yan Naing', 'yan.naing@example.com', 3, 'Decent overall', 'Everything was fine, but delivery took a little longer than expected.', 'published'],
];

foreach ($reviewRows as [$name, $email, $rating, $title, $comment, $status]) {
    $reviewStmt->execute([
        'name' => $name,
        'email' => $email,
        'rating' => $rating,
        'title' => $title,
        'comment' => $comment,
        'status' => $status,
    ]);
}

$inquiryStmt = $db->prepare('INSERT INTO inquiries (full_name, email, subject, message, status) VALUES (:full_name, :email, :subject, :message, :status)');
$inquiryRows = [
    ['Thiri Kyaw', 'thiri.kyaw@example.com', 'Order status', 'Can you share an update for order #ORD-8821?', 'new'],
    ['Min Htet', 'min.htet@example.com', 'Bulk purchase', 'I need a quote for bulk medical gloves and masks.', 'new'],
    ['Cho Su', 'cho.su@example.com', 'Product question', 'Is this blood pressure monitor covered by warranty?', 'new'],
    ['Aye Chan', 'aye.chan@example.com', 'Delivery area', 'Do you deliver to Pyin Oo Lwin and nearby areas?', 'new'],
    ['Khin May', 'khin.may@example.com', 'Payment issue', 'My payment went through but I did not receive confirmation.', 'new'],
];

foreach ($inquiryRows as [$fullName, $email, $subject, $message, $status]) {
    $inquiryStmt->execute([
        'full_name' => $fullName,
        'email' => $email,
        'subject' => $subject,
        'message' => $message,
        'status' => $status,
    ]);
}

$orderStmt = $db->prepare(
    'INSERT INTO orders (order_code, user_id, payment_method, shipping_name, shipping_email, shipping_phone, shipping_city, shipping_address, subtotal_ks, tax_ks, total_ks, status)
     VALUES (:order_code, :user_id, :payment_method, :shipping_name, :shipping_email, :shipping_phone, :shipping_city, :shipping_address, :subtotal_ks, :tax_ks, :total_ks, :status)'
);
$orderItemStmt = $db->prepare(
    'INSERT INTO order_items (order_id, product_id, qty, unit_price_ks, total_price_ks)
     VALUES (:order_id, :product_id, :qty, :unit_price_ks, :total_price_ks)'
);

$demoOrderItems = [
    ['slug' => $products[0]['slug'], 'qty' => 2],
    ['slug' => $products[1]['slug'], 'qty' => 1],
];

$demoSubtotal = 0;
foreach ($demoOrderItems as &$item) {
    $productId = $productIdsBySlug[$item['slug']] ?? null;
    if ($productId === null) {
        continue;
    }

    $productRow = array_values(array_filter($products, static fn (array $product): bool => $product['id'] === $productId))[0] ?? null;
    if ($productRow === null) {
        continue;
    }

    $item['product_id'] = $productId;
    $item['unit_price_ks'] = (int) $productRow['price_ks'];
    $item['total_price_ks'] = (int) $productRow['price_ks'] * (int) $item['qty'];
    $demoSubtotal += $item['total_price_ks'];
}
unset($item);

$demoTax = (int) round($demoSubtotal * 0.05);
$demoTotal = $demoSubtotal + $demoTax;

$orderStmt->execute([
    'order_code' => 'ORD-9100',
    'user_id' => 3,
    'payment_method' => 'cod',
    'shipping_name' => 'Alex Rivers',
    'shipping_email' => 'customer@medical.local',
    'shipping_phone' => '09-444-222-111',
    'shipping_city' => 'Yangon',
    'shipping_address' => 'No. 24, Lanmadaw Township, Yangon',
    'subtotal_ks' => $demoSubtotal,
    'tax_ks' => $demoTax,
    'total_ks' => $demoTotal,
    'status' => 'confirmed',
]);

$demoOrderId = (int) $db->lastInsertId();
foreach ($demoOrderItems as $item) {
    if (!isset($item['product_id'], $item['unit_price_ks'], $item['total_price_ks'])) {
        continue;
    }

    $orderItemStmt->execute([
        'order_id' => $demoOrderId,
        'product_id' => $item['product_id'],
        'qty' => $item['qty'],
        'unit_price_ks' => $item['unit_price_ks'],
        'total_price_ks' => $item['total_price_ks'],
    ]);
}

$deliveryStmt = $db->prepare('INSERT INTO deliveries (order_code, hospital, courier, eta_text, progress, lat, lng, status) VALUES (:order_code, :hospital, :courier, :eta_text, :progress, :lat, :lng, :status)');
$deliveryRows = [
    ['ORD-9100', 'No. 24, Lanmadaw Township, Yangon', 'Point', 'Point သို့ မအပ်ရသေး', 10, null, null, 'queued'],
    ['#ORD-8821', 'Central General Hospital', 'Alex Rivers', '12 mins', 75, 21.984, 96.102, 'in_transit'],
    ['#ORD-8819', "St. Mary's Pharmacy", 'Sarah Chen', '1h 32m', 30, 21.964, 96.088, 'in_transit'],
    ['#ORD-8794', 'Northwest Medical', 'James Wilson', 'Delayed', 90, 21.950, 96.115, 'delayed'],
];

foreach ($deliveryRows as [$orderCode, $hospital, $courier, $eta, $progress, $lat, $lng, $status]) {
    $deliveryStmt->execute([
        'order_code' => $orderCode,
        'hospital' => $hospital,
        'courier' => $courier,
        'eta_text' => $eta,
        'progress' => $progress,
        'lat' => $lat,
        'lng' => $lng,
        'status' => $status,
    ]);
}

echo 'Database initialized with seed data from frontend catalog (' . count($products) . " products).\n";
