<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Core/bootstrap.php';
load_env(__DIR__ . '/../.env');

$dbConfig = config('database');
$mysql = $dbConfig['mysql'];
$sqlitePath = __DIR__ . '/../database/app.sqlite';
$schemaPath = __DIR__ . '/../database/schema.sql';

if (!is_file($sqlitePath)) {
    throw new RuntimeException('SQLite database not found at ' . $sqlitePath);
}

if (!is_file($schemaPath)) {
    throw new RuntimeException('MySQL schema file not found at ' . $schemaPath);
}

$sqlite = new PDO('sqlite:' . $sqlitePath);
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$sqlite->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

$serverDsn = sprintf(
    'mysql:host=%s;port=%d;charset=%s',
    $mysql['host'],
    $mysql['port'],
    $mysql['charset']
);

$server = new PDO($serverDsn, $mysql['username'], $mysql['password']);
$server->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$server->exec(sprintf('DROP DATABASE IF EXISTS `%s`', $mysql['database']));
$server->exec(sprintf(
    'CREATE DATABASE `%s` CHARACTER SET %s COLLATE %s_general_ci',
    $mysql['database'],
    $mysql['charset'],
    $mysql['charset']
));

$mysqlDsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
    $mysql['host'],
    $mysql['port'],
    $mysql['database'],
    $mysql['charset']
);

$mysqlDb = new PDO($mysqlDsn, $mysql['username'], $mysql['password']);
$mysqlDb->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$mysqlDb->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

$schema = file_get_contents($schemaPath);
if ($schema === false) {
    throw new RuntimeException('Unable to read MySQL schema');
}

$mysqlDb->exec($schema);
$mysqlDb->exec('SET FOREIGN_KEY_CHECKS=0');

$copyOrder = [
    'users',
    'products',
    'inventory_items',
    'customers',
    'orders',
    'order_items',
    'deliveries',
    'reviews',
    'inquiries',
];

foreach ($copyOrder as $table) {
    $columns = [];
    $columnStmt = $sqlite->query("PRAGMA table_info({$table})");
    foreach ($columnStmt->fetchAll() as $column) {
        $name = $column['name'] ?? null;
        if (is_string($name) && $name !== '') {
            $columns[] = $name;
        }
    }

    if ($columns === []) {
        continue;
    }

    $rows = $sqlite->query("SELECT * FROM {$table}")->fetchAll();
    if ($rows === []) {
        echo "Skipped {$table} (0 rows)\n";
        continue;
    }

    $columnList = implode(', ', array_map(static fn (string $col): string => "`{$col}`", $columns));
    $placeholders = implode(', ', array_map(static fn (string $col): string => ':' . $col, $columns));
    $insert = $mysqlDb->prepare("INSERT INTO `{$table}` ({$columnList}) VALUES ({$placeholders})");

    foreach ($rows as $row) {
        $payload = [];
        foreach ($columns as $column) {
            $payload[$column] = $row[$column] ?? null;
        }
        $insert->execute($payload);
    }

    $maxId = 0;
    if (in_array('id', $columns, true)) {
        $maxId = (int) $mysqlDb->query("SELECT COALESCE(MAX(id), 0) AS max_id FROM `{$table}`")->fetchColumn();
        if ($maxId > 0) {
            $mysqlDb->exec("ALTER TABLE `{$table}` AUTO_INCREMENT = " . ($maxId + 1));
        }
    }

    echo "Migrated {$table} (" . count($rows) . " rows)\n";
}

$mysqlDb->exec('SET FOREIGN_KEY_CHECKS=1');

echo "SQLite data migrated to MySQL database `{$mysql['database']}`.\n";
