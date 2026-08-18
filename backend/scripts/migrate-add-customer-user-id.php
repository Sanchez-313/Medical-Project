<?php

declare(strict_types=1);

use App\Core\Database;

require_once __DIR__ . '/../src/Core/bootstrap.php';
load_env(__DIR__ . '/../.env');

$db = Database::connection();
$driver = (string) $db->getAttribute(PDO::ATTR_DRIVER_NAME);

if ($driver === 'sqlite') {
    $hasColumn = false;
    $stmt = $db->query('PRAGMA table_info(customers)');
    $rows = $stmt ? $stmt->fetchAll() : [];
    foreach ($rows as $row) {
        if (($row['name'] ?? '') === 'user_id') {
            $hasColumn = true;
            break;
        }
    }

    if (!$hasColumn) {
        $db->exec('ALTER TABLE customers ADD COLUMN user_id INTEGER NULL');
    }

    $db->exec('CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_unique ON customers(user_id)');

    echo "SQLite migration completed.\n";
    exit;
}

$exists = $db->query("SHOW COLUMNS FROM customers LIKE 'user_id'")->fetch();
if (!$exists) {
    $db->exec('ALTER TABLE customers ADD COLUMN user_id INT NULL');
}

try {
    $db->exec('ALTER TABLE customers ADD UNIQUE KEY uq_customers_user (user_id)');
} catch (Throwable $e) {
    // ignore if it already exists
}

try {
    $db->exec('ALTER TABLE customers ADD CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL');
} catch (Throwable $e) {
    // ignore if it already exists
}

echo "MySQL migration completed.\n";
