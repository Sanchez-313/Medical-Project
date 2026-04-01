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

$products = [
    ['id' => 79, 'name' => 'ဦးချိန်တီ(U Chain Te)', 'category' => 'MyanmarMedicine', 'price_ks' => 2200, 'stock' => 15, 'expiry_date' => '2027-06-30', 'description' => 'Headaches, minor fevers, stomach upset, and fatigue.'],
    ['id' => 80, 'name' => 'Generlog Oral', 'category' => 'EnglishMedicine', 'price_ks' => 4200, 'stock' => 18, 'expiry_date' => '2027-08-31', 'description' => 'Oral antibiotic medicine commonly used for bacterial infections. Use only as directed by the label or a healthcare professional.'],
    ['id' => 81, 'name' => 'Gentalene-C Cream', 'category' => 'EnglishMedicine', 'price_ks' => 3900, 'stock' => 14, 'expiry_date' => '2027-07-31', 'description' => 'Topical cream commonly used for inflamed or irritated skin conditions. Apply as directed.'],
    ['id' => 82, 'name' => 'Win (Methylated Spirit)', 'category' => 'MyanmarMedicine', 'price_ks' => 2500, 'stock' => 10, 'expiry_date' => '2028-01-31', 'description' => 'Topical antiseptic spirit used for external cleaning and hygiene support. For external use only.'],
    ['id' => 83, 'name' => 'Enervon-C', 'category' => 'EnglishMedicine', 'price_ks' => 6500, 'stock' => 22, 'expiry_date' => '2027-11-30', 'description' => 'Multivitamin supplement with vitamin C to support daily wellness and energy.'],
    ['id' => 84, 'name' => 'Axiona', 'category' => 'EnglishMedicine', 'price_ks' => 2800, 'stock' => 16, 'expiry_date' => '2027-09-30', 'description' => 'Pain relief medicine commonly used for mild to moderate aches and fever support. Use as directed.'],
    ['id' => 85, 'name' => 'Ribovit Tablet', 'category' => 'EnglishMedicine', 'price_ks' => 4800, 'stock' => 12, 'expiry_date' => '2027-10-31', 'description' => 'Vitamin B complex supplement used to support energy and nutritional balance.'],
    ['id' => 86, 'name' => 'Kotase', 'category' => 'EnglishMedicine', 'price_ks' => 3000, 'stock' => 9, 'expiry_date' => '2027-05-31', 'description' => 'Digestive support medicine commonly used for stomach comfort and digestion support.'],
    ['id' => 87, 'name' => 'Multivitaminus', 'category' => 'EnglishMedicine', 'price_ks' => 5200, 'stock' => 20, 'expiry_date' => '2027-12-31', 'description' => 'Multivitamin supplement used to support daily nutritional needs and general wellness.'],
    ['id' => 88, 'name' => 'SEZO-B Cream', 'category' => 'EnglishMedicine', 'price_ks' => 3600, 'stock' => 11, 'expiry_date' => '2027-08-31', 'description' => 'Topical cream used for minor skin irritation and surface discomfort. Apply as directed.'],
    ['id' => 89, 'name' => 'Fungiderm Cream', 'category' => 'EnglishMedicine', 'price_ks' => 4300, 'stock' => 13, 'expiry_date' => '2027-10-31', 'description' => 'Antifungal cream commonly used for fungal skin infections and itching. Apply as directed.'],
];

$db = Database::connection();
$driver = (string) $db->getAttribute(PDO::ATTR_DRIVER_NAME);

if ($driver === 'sqlite') {
    $columns = $db->query('PRAGMA table_info(products)')->fetchAll(PDO::FETCH_ASSOC);
    $hasExpiryDate = false;
    foreach ($columns as $column) {
        if (($column['name'] ?? '') === 'expiry_date') {
            $hasExpiryDate = true;
            break;
        }
    }

    if (!$hasExpiryDate) {
        $db->exec('ALTER TABLE products ADD COLUMN expiry_date TEXT NULL');
    }
}

$productStmt = $db->prepare(
    'INSERT INTO products (id, name, slug, category, price_ks, stock, expiry_date, image_url, description, is_active)
     VALUES (:id, :name, :slug, :category, :price_ks, :stock, :expiry_date, NULL, :description, 1)
     ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         slug = excluded.slug,
         category = excluded.category,
         price_ks = excluded.price_ks,
         stock = excluded.stock,
         expiry_date = excluded.expiry_date,
         description = excluded.description,
         is_active = 1,
         updated_at = CURRENT_TIMESTAMP'
);

$findInventoryStmt = $db->prepare('SELECT id FROM inventory_items WHERE product_id = :product_id LIMIT 1');
$insertInventoryStmt = $db->prepare(
    'INSERT INTO inventory_items (product_id, name, sku, category, stock, total_stock, price_ks, status)
     VALUES (:product_id, :name, :sku, :category, :stock, :total_stock, :price_ks, :status)'
);
$updateInventoryStmt = $db->prepare(
    'UPDATE inventory_items
     SET name = :name,
         sku = :sku,
         category = :category,
         stock = :stock,
         total_stock = :total_stock,
         price_ks = :price_ks,
         status = :status,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = :id'
);

foreach ($products as $product) {
    $productStmt->execute([
        'id' => $product['id'],
        'name' => $product['name'],
        'slug' => build_slug($product['name'], (int) $product['id']),
        'category' => $product['category'],
        'price_ks' => $product['price_ks'],
        'stock' => $product['stock'],
        'expiry_date' => $product['expiry_date'],
        'description' => $product['description'],
    ]);

    $stock = (int) $product['stock'];
    $inventoryPayload = [
        'product_id' => $product['id'],
        'name' => $product['name'],
        'sku' => sprintf('MED-%04d', (int) $product['id']),
        'category' => $product['category'],
        'stock' => $stock,
        'total_stock' => $stock,
        'price_ks' => $product['price_ks'],
        'status' => $stock <= 0 ? 'expired' : ($stock < 25 ? 'low' : 'normal'),
    ];

    $findInventoryStmt->execute(['product_id' => $product['id']]);
    $inventoryId = (int) $findInventoryStmt->fetchColumn();

    if ($inventoryId > 0) {
        $updateInventoryStmt->execute($inventoryPayload + ['id' => $inventoryId]);
    } else {
        $insertInventoryStmt->execute($inventoryPayload);
    }
}

echo 'Upserted additional products into active database: ' . $driver . PHP_EOL;
