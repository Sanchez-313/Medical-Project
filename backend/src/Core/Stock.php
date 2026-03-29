<?php

declare(strict_types=1);

namespace App\Core;

use PDO;

final class Stock
{
    public static function reservedQty(PDO $db, int $userId, int $productId): int
    {
        $stmt = $db->prepare('SELECT qty FROM cart_items WHERE user_id = :user_id AND product_id = :product_id LIMIT 1');
        $stmt->execute([
            'user_id' => $userId,
            'product_id' => $productId,
        ]);
        $row = $stmt->fetch();
        return $row ? max(0, (int) $row['qty']) : 0;
    }

    public static function fetchActiveProduct(PDO $db, int $productId): ?array
    {
        $stmt = $db->prepare(
            'SELECT p.id, p.name, p.category, p.image_url, p.description, p.is_active,
                    COALESCE(ii.price_ks, p.price_ks) AS price_ks,
                    COALESCE(ii.stock, p.stock) AS stock
             FROM products p
             LEFT JOIN inventory_items ii ON ii.product_id = p.id
             WHERE p.id = :id
             LIMIT 1'
        );
        $stmt->execute(['id' => $productId]);
        $product = $stmt->fetch();
        if (!$product || (int) ($product['is_active'] ?? 0) !== 1) {
            return null;
        }

        return $product;
    }

    public static function adjustAvailableStock(PDO $db, int $productId, int $delta): void
    {
        if ($delta === 0) {
            return;
        }

        if ($delta < 0) {
            $amount = abs($delta);
            $productStmt = $db->prepare(
                'UPDATE products
                 SET stock = stock - :qty, updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id AND stock >= :qty'
            );
            $productStmt->execute([
                'id' => $productId,
                'qty' => $amount,
            ]);

            if ($productStmt->rowCount() !== 1) {
                throw new \RuntimeException("Insufficient stock for product {$productId}");
            }

            $inventoryStmt = $db->prepare(
                'UPDATE inventory_items
                 SET stock = stock - :qty, updated_at = CURRENT_TIMESTAMP
                 WHERE product_id = :id'
            );
            $inventoryStmt->execute([
                'id' => $productId,
                'qty' => $amount,
            ]);

            return;
        }

        $productStmt = $db->prepare(
            'UPDATE products
             SET stock = stock + :qty, updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $productStmt->execute([
            'id' => $productId,
            'qty' => $delta,
        ]);

        $inventoryStmt = $db->prepare(
            'UPDATE inventory_items
             SET stock = stock + :qty, updated_at = CURRENT_TIMESTAMP
             WHERE product_id = :id'
        );
        $inventoryStmt->execute([
            'id' => $productId,
            'qty' => $delta,
        ]);
    }
}
