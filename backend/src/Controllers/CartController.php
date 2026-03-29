<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Core\Stock;

final class CartController extends Controller
{
    public function index(Request $request): void
    {
        $actor = Auth::requireRole($request, ['customer', 'staff', 'admin']);
        if ($actor === null) {
            return;
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'SELECT
                ci.product_id,
                ci.qty,
                p.name,
                p.category,
                p.image_url,
                p.description,
                COALESCE(ii.price_ks, p.price_ks) AS price_ks,
                COALESCE(ii.stock, p.stock) AS stock
             FROM cart_items ci
             INNER JOIN products p ON p.id = ci.product_id
             LEFT JOIN inventory_items ii ON ii.product_id = p.id
             WHERE ci.user_id = :user_id
             ORDER BY ci.id DESC'
        );
        $stmt->execute(['user_id' => (int) $actor['sub']]);

        $items = array_map(static function (array $row): array {
            return [
                'product_id' => (int) $row['product_id'],
                'qty' => (int) $row['qty'],
                'name' => (string) $row['name'],
                'category' => (string) $row['category'],
                'image_url' => $row['image_url'],
                'description' => (string) ($row['description'] ?? ''),
                'price_ks' => (int) $row['price_ks'],
                'stock' => (int) $row['stock'],
            ];
        }, $stmt->fetchAll());

        $this->ok(['items' => $items]);
    }

    public function store(Request $request): void
    {
        $actor = Auth::requireRole($request, ['customer', 'staff', 'admin']);
        if ($actor === null) {
            return;
        }

        $productId = (int) $request->body('product_id', 0);
        $qty = max(1, (int) $request->body('qty', 1));
        $userId = (int) $actor['sub'];

        $db = Database::connection();
        $db->beginTransaction();

        try {
            $product = Stock::fetchActiveProduct($db, $productId);
            if ($product === null) {
                throw new \RuntimeException('product not found');
            }

            if ((int) $product['stock'] < $qty) {
                throw new \RuntimeException('Insufficient stock');
            }

            Stock::adjustAvailableStock($db, $productId, -$qty);

            $existingQty = Stock::reservedQty($db, $userId, $productId);
            if ($existingQty > 0) {
                $stmt = $db->prepare(
                    'UPDATE cart_items
                     SET qty = qty + :qty, updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = :user_id AND product_id = :product_id'
                );
                $stmt->execute([
                    'qty' => $qty,
                    'user_id' => $userId,
                    'product_id' => $productId,
                ]);
            } else {
                $stmt = $db->prepare(
                    'INSERT INTO cart_items (user_id, product_id, qty)
                     VALUES (:user_id, :product_id, :qty)'
                );
                $stmt->execute([
                    'user_id' => $userId,
                    'product_id' => $productId,
                    'qty' => $qty,
                ]);
            }

            $db->commit();
            $this->ok([
                'product_id' => $productId,
                'qty' => $existingQty + $qty,
            ], 201);
        } catch (\Throwable $e) {
            $db->rollBack();
            Response::json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function update(Request $request, array $params): void
    {
        $actor = Auth::requireRole($request, ['customer', 'staff', 'admin']);
        if ($actor === null) {
            return;
        }

        $productId = (int) ($params['productId'] ?? 0);
        $nextQty = max(0, (int) $request->body('qty', 0));
        $userId = (int) $actor['sub'];

        $db = Database::connection();
        $db->beginTransaction();

        try {
            $currentQty = Stock::reservedQty($db, $userId, $productId);
            if ($currentQty === 0 && $nextQty > 0) {
                throw new \RuntimeException('Cart item not found');
            }

            $delta = $nextQty - $currentQty;
            if ($delta > 0) {
                $product = Stock::fetchActiveProduct($db, $productId);
                if ($product === null || (int) $product['stock'] < $delta) {
                    throw new \RuntimeException('Insufficient stock');
                }
                Stock::adjustAvailableStock($db, $productId, -$delta);
            } elseif ($delta < 0) {
                Stock::adjustAvailableStock($db, $productId, abs($delta));
            }

            if ($nextQty <= 0) {
                $stmt = $db->prepare(
                    'DELETE FROM cart_items WHERE user_id = :user_id AND product_id = :product_id'
                );
                $stmt->execute([
                    'user_id' => $userId,
                    'product_id' => $productId,
                ]);
            } else {
                $stmt = $db->prepare(
                    'UPDATE cart_items
                     SET qty = :qty, updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = :user_id AND product_id = :product_id'
                );
                $stmt->execute([
                    'qty' => $nextQty,
                    'user_id' => $userId,
                    'product_id' => $productId,
                ]);
            }

            $db->commit();
            $this->ok([
                'product_id' => $productId,
                'qty' => $nextQty,
            ]);
        } catch (\Throwable $e) {
            $db->rollBack();
            Response::json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy(Request $request, array $params): void
    {
        $actor = Auth::requireRole($request, ['customer', 'staff', 'admin']);
        if ($actor === null) {
            return;
        }

        $productId = (int) ($params['productId'] ?? 0);
        $userId = (int) $actor['sub'];
        $db = Database::connection();
        $db->beginTransaction();

        try {
            $currentQty = Stock::reservedQty($db, $userId, $productId);
            if ($currentQty <= 0) {
                throw new \RuntimeException('Cart item not found');
            }

            Stock::adjustAvailableStock($db, $productId, $currentQty);
            $stmt = $db->prepare(
                'DELETE FROM cart_items WHERE user_id = :user_id AND product_id = :product_id'
            );
            $stmt->execute([
                'user_id' => $userId,
                'product_id' => $productId,
            ]);

            $db->commit();
            $this->ok(['removed' => true]);
        } catch (\Throwable $e) {
            $db->rollBack();
            Response::json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function clear(Request $request): void
    {
        $actor = Auth::requireRole($request, ['customer', 'staff', 'admin']);
        if ($actor === null) {
            return;
        }

        $db = Database::connection();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare('SELECT product_id, qty FROM cart_items WHERE user_id = :user_id');
            $stmt->execute(['user_id' => (int) $actor['sub']]);
            $items = $stmt->fetchAll();

            foreach ($items as $item) {
                Stock::adjustAvailableStock($db, (int) $item['product_id'], (int) $item['qty']);
            }

            $deleteStmt = $db->prepare('DELETE FROM cart_items WHERE user_id = :user_id');
            $deleteStmt->execute(['user_id' => (int) $actor['sub']]);

            $db->commit();
            $this->ok(['cleared' => true]);
        } catch (\Throwable $e) {
            $db->rollBack();
            Response::json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
