<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

final class InventoryController extends Controller
{
    public function index(Request $request): void
    {
        $actor = Auth::requireRole($request, ['admin', 'staff']);
        if ($actor === null) {
            return;
        }

        $search = trim((string) $request->query('search', ''));
        $category = trim((string) $request->query('category', ''));

        $sql = 'SELECT id, name, sku, category, stock, total_stock, price_ks, status FROM inventory_items WHERE 1=1';
        $params = [];

        if ($search !== '') {
            $sql .= ' AND (name LIKE :search OR sku LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        if ($category !== '') {
            $sql .= ' AND category = :category';
            $params['category'] = $category;
        }

        $sql .= ' ORDER BY id DESC';

        $db = Database::connection();
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $this->ok(['items' => $stmt->fetchAll()]);
    }

    public function update(Request $request, array $params): void
    {
        $actor = Auth::requireRole($request, ['admin', 'staff']);
        if ($actor === null) {
            return;
        }

        $id = (int) ($params['id'] ?? 0);
        $stock = $request->body('stock');
        $price = $request->body('price_ks');
        $status = $request->body('status');

        if (!is_numeric($stock) || !is_numeric($price) || !is_string($status)) {
            $this->badRequest('stock, price_ks and status are required');
            return;
        }

        $db = Database::connection();
        $db->beginTransaction();

        try {
            $itemStmt = $db->prepare('SELECT product_id FROM inventory_items WHERE id = :id LIMIT 1');
            $itemStmt->execute(['id' => $id]);
            $item = $itemStmt->fetch();

            if (!$item) {
                $db->rollBack();
                Response::json(['success' => false, 'message' => 'inventory item not found'], 404);
                return;
            }

            $stmt = $db->prepare('UPDATE inventory_items SET stock = :stock, price_ks = :price, status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
            $stmt->execute([
                'id' => $id,
                'stock' => (int) $stock,
                'price' => (int) $price,
                'status' => $status,
            ]);

            if ($item['product_id'] !== null) {
                $productStmt = $db->prepare('UPDATE products SET stock = :stock, price_ks = :price, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
                $productStmt->execute([
                    'id' => (int) $item['product_id'],
                    'stock' => (int) $stock,
                    'price' => (int) $price,
                ]);
            }

            $db->commit();
            $this->ok(['updated' => true]);
        } catch (\Throwable $e) {
            $db->rollBack();
            Response::json(['success' => false, 'message' => 'failed to update inventory'], 500);
        }
    }
}
