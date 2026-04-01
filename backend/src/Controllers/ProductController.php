<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\CartReservation;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

final class ProductController extends Controller
{
    private function selectColumns(): string
    {
        return 'p.id,
                p.name,
                p.slug,
                p.category,
                COALESCE(ii.price_ks, p.price_ks) AS price_ks,
                p.image_url,
                COALESCE(ii.stock, p.stock) AS stock,
                p.expiry_date,
                p.description,
                p.created_at,
                p.updated_at,
                p.is_active';
    }

    public function index(Request $request): void
    {
        $category = trim((string) $request->query('category', ''));
        $search = trim((string) $request->query('search', ''));
        $limit = (int) $request->query('limit', 50);
        $offset = (int) $request->query('offset', 0);
        $limit = max(1, min($limit, 200));

        $sql = 'SELECT 
                    ' . $this->selectColumns() . '
                FROM products p
                LEFT JOIN inventory_items ii ON ii.product_id = p.id
                WHERE p.is_active = 1';
        $params = [];

        if ($category !== '') {
            $sql .= ' AND p.category = :category';
            $params['category'] = $category;
        }

        if ($search !== '') {
            $sql .= ' AND p.name LIKE :search';
            $params['search'] = '%' . $search . '%';
        }

        $sql .= ' ORDER BY COALESCE(ii.stock, p.stock) ASC, p.id ASC LIMIT :limit OFFSET :offset';

        $db = Database::connection();
        CartReservation::releaseExpiredReservations($db);
        $stmt = $db->prepare($sql);

        foreach ($params as $k => $v) {
            $stmt->bindValue(':' . $k, $v);
        }

        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', max(0, $offset), \PDO::PARAM_INT);
        $stmt->execute();

        $this->ok(['products' => $stmt->fetchAll()]);
    }

    public function show(Request $request, array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        $db = Database::connection();
        CartReservation::releaseExpiredReservations($db);
        $stmt = $db->prepare(
            'SELECT
                ' . $this->selectColumns() . '
            FROM products p
            LEFT JOIN inventory_items ii ON ii.product_id = p.id
            WHERE p.id = :id
            LIMIT 1'
        );
        $stmt->execute(['id' => $id]);

        $product = $stmt->fetch();
        if (!$product) {
            Response::json(['success' => false, 'message' => 'product not found'], 404);
            return;
        }

        $this->ok(['product' => $product]);
    }

    public function upsertDetected(Request $request): void
    {
        $payload = $request->allBody();
        $id = (int) ($payload['id'] ?? 0);
        $name = trim((string) ($payload['name'] ?? ''));
        $category = trim((string) ($payload['category'] ?? 'EnglishMedicine'));
        $price = max(0, (int) ($payload['price_ks'] ?? $payload['price'] ?? 0));
        $stock = max(0, (int) ($payload['stock'] ?? 0));
        $description = trim((string) ($payload['description'] ?? ''));
        $imageUrl = trim((string) ($payload['image_url'] ?? ''));
        $expiryDate = trim((string) ($payload['expiry_date'] ?? $payload['expiryDate'] ?? ''));

        if ($id <= 0 || $name === '' || $price <= 0 || $category === '') {
            $this->badRequest('Detected medicine payload is incomplete.');
            return;
        }

        if ($expiryDate !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $expiryDate) !== 1) {
            $this->badRequest('Expiry date must use YYYY-MM-DD format.');
            return;
        }

        $slug = $this->buildSlug($name, $id);
        $db = Database::connection();

        $existingStmt = $db->prepare(
            'SELECT id FROM products
             WHERE id = :id OR slug = :slug OR LOWER(name) = LOWER(:name)
             ORDER BY CASE WHEN id = :id THEN 0 ELSE 1 END
             LIMIT 1'
        );
        $existingStmt->execute([
            'id' => $id,
            'slug' => $slug,
            'name' => $name,
        ]);

        $existingProduct = $existingStmt->fetch();
        $resolvedId = (int) ($existingProduct['id'] ?? 0);

        if ($resolvedId > 0) {
            $updateStmt = $db->prepare(
                'UPDATE products
                 SET name = :name,
                     slug = :slug,
                     category = :category,
                     price_ks = :price_ks,
                     stock = :stock,
                     expiry_date = :expiry_date,
                     image_url = COALESCE(NULLIF(:image_url, \'\'), image_url),
                     description = COALESCE(NULLIF(:description, \'\'), description),
                     is_active = 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $updateStmt->execute([
                'id' => $resolvedId,
                'name' => $name,
                'slug' => $slug,
                'category' => $category,
                'price_ks' => $price,
                'stock' => $stock,
                'expiry_date' => $expiryDate !== '' ? $expiryDate : null,
                'image_url' => $imageUrl,
                'description' => $description,
            ]);
        } else {
            $insertStmt = $db->prepare(
                'INSERT INTO products (id, name, slug, category, price_ks, stock, expiry_date, image_url, description, is_active)
                 VALUES (:id, :name, :slug, :category, :price_ks, :stock, :expiry_date, :image_url, :description, 1)'
            );
            $insertStmt->execute([
                'id' => $id,
                'name' => $name,
                'slug' => $slug,
                'category' => $category,
                'price_ks' => $price,
                'stock' => $stock,
                'expiry_date' => $expiryDate !== '' ? $expiryDate : null,
                'image_url' => $imageUrl !== '' ? $imageUrl : null,
                'description' => $description !== '' ? $description : null,
            ]);
            $resolvedId = $id;
        }

        $inventoryStmt = $db->prepare('SELECT id FROM inventory_items WHERE product_id = :product_id LIMIT 1');
        $inventoryStmt->execute(['product_id' => $resolvedId]);
        $inventoryRow = $inventoryStmt->fetch();
        $status = $stock <= 0 ? 'expired' : ($stock < 25 ? 'low' : 'normal');

        if ($inventoryRow) {
            $updateInventoryStmt = $db->prepare(
                'UPDATE inventory_items
                 SET name = :name,
                     category = :category,
                     stock = :stock,
                     total_stock = CASE WHEN total_stock < :stock THEN :stock ELSE total_stock END,
                     price_ks = :price_ks,
                     status = :status,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE product_id = :product_id'
            );
            $updateInventoryStmt->execute([
                'product_id' => $resolvedId,
                'name' => $name,
                'category' => $category,
                'stock' => $stock,
                'price_ks' => $price,
                'status' => $status,
            ]);
        } else {
            $insertInventoryStmt = $db->prepare(
                'INSERT INTO inventory_items (product_id, name, sku, category, stock, total_stock, price_ks, status)
                 VALUES (:product_id, :name, :sku, :category, :stock, :total_stock, :price_ks, :status)'
            );
            $insertInventoryStmt->execute([
                'product_id' => $resolvedId,
                'name' => $name,
                'sku' => sprintf('MED-%04d', $resolvedId),
                'category' => $category,
                'stock' => $stock,
                'total_stock' => $stock,
                'price_ks' => $price,
                'status' => $status,
            ]);
        }

        $productStmt = $db->prepare(
            'SELECT ' . $this->selectColumns() . '
             FROM products p
             LEFT JOIN inventory_items ii ON ii.product_id = p.id
             WHERE p.id = :id
             LIMIT 1'
        );
        $productStmt->execute(['id' => $resolvedId]);

        $this->ok(['product' => $productStmt->fetch()], $existingProduct ? 200 : 201);
    }

    private function buildSlug(string $name, int $id): string
    {
        $slug = strtolower($name);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
        $slug = trim($slug, '-');

        if ($slug === '') {
            $slug = 'product';
        }

        return sprintf('%s-%d', $slug, $id);
    }
}
