<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

final class Database
{
    private static ?PDO $pdo = null;

    private static function sqliteColumnExists(PDO $pdo, string $table, string $column): bool
    {
        $stmt = $pdo->query(sprintf('PRAGMA table_info(%s)', $table));
        $columns = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

        foreach ($columns as $definition) {
            if (($definition['name'] ?? null) === $column) {
                return true;
            }
        }

        return false;
    }

    private static function mysqlColumnExists(PDO $pdo, string $database, string $table, string $column): bool
    {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = :database AND TABLE_NAME = :table AND COLUMN_NAME = :column'
        );
        $stmt->execute([
            'database' => $database,
            'table' => $table,
            'column' => $column,
        ]);

        return (int) $stmt->fetchColumn() > 0;
    }

    private static function ensureSchemaExtensions(PDO $pdo, array $cfg): void
    {
        if (($cfg['driver'] ?? 'sqlite') === 'sqlite') {
            $pdo->exec(
                'CREATE TABLE IF NOT EXISTS cart_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    qty INTEGER NOT NULL DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (user_id, product_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )'
            );

            if (!self::sqliteColumnExists($pdo, 'products', 'expiry_date')) {
                $pdo->exec('ALTER TABLE products ADD COLUMN expiry_date TEXT NULL');
            }

            return;
        }

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS cart_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                qty INT NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT uq_cart_items_user_product UNIQUE (user_id, product_id),
                CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );

        if (!self::mysqlColumnExists($pdo, (string) ($cfg['mysql']['database'] ?? ''), 'products', 'expiry_date')) {
            $pdo->exec('ALTER TABLE products ADD COLUMN expiry_date DATE NULL AFTER stock');
        }
    }

    private static function sqlitePath(array $cfg): string
    {
        $path = (string) ($cfg['sqlite']['path'] ?? '');
        if ($path === '') {
            return dirname(__DIR__, 2) . '/database/app.sqlite';
        }

        if (preg_match('/^(?:[A-Za-z]:[\\\\\/]|[\\\\\/])/', $path) === 1) {
            return $path;
        }

        return dirname(__DIR__, 2) . '/' . ltrim(str_replace('\\', '/', $path), '/');
    }

    public static function healthCheck(): array
    {
        $cfg = config('database');
        $driver = $cfg['driver'] ?? 'unknown';

        try {
            if ($driver === 'sqlite') {
                $dbPath = self::sqlitePath($cfg);
                $dir = dirname($dbPath);
                if (!is_dir($dir)) {
                    mkdir($dir, 0777, true);
                }
                $pdo = new PDO('sqlite:' . $dbPath);
            } else {
                $mysql = $cfg['mysql'];
                $dsn = sprintf(
                    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                    $mysql['host'],
                    $mysql['port'],
                    $mysql['database'],
                    $mysql['charset']
                );
                $pdo = new PDO($dsn, $mysql['username'], $mysql['password']);
            }

            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->query('SELECT 1')->fetchColumn();

            return [
                'status' => 'ok',
                'driver' => $driver,
            ];
        } catch (PDOException $e) {
            return [
                'status' => 'down',
                'driver' => $driver,
                'error' => $e->getMessage(),
            ];
        }
    }

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $cfg = config('database');

        try {
            if ($cfg['driver'] === 'sqlite') {
                $dbPath = self::sqlitePath($cfg);
                $dir = dirname($dbPath);
                if (!is_dir($dir)) {
                    mkdir($dir, 0777, true);
                }
                self::$pdo = new PDO('sqlite:' . $dbPath);
            } else {
                $mysql = $cfg['mysql'];
                $dsn = sprintf(
                    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                    $mysql['host'],
                    $mysql['port'],
                    $mysql['database'],
                    $mysql['charset']
                );

                self::$pdo = new PDO($dsn, $mysql['username'], $mysql['password']);
            }

            self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            self::ensureSchemaExtensions(self::$pdo, $cfg);

            return self::$pdo;
        } catch (PDOException $e) {
            Response::json([
                'success' => false,
                'message' => 'Database connection failed',
                'error' => $e->getMessage(),
            ], 500);
            exit;
        }
    }
}
