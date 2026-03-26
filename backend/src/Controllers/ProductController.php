<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

final class ProductController extends Controller
{
    public function index(Request $request): void
    {
        $category = trim((string) $request->query('category', ''));
        $search = trim((string) $request->query('search', ''));
        $limit = (int) $request->query('limit', 50);
        $offset = (int) $request->query('offset', 0);
        $limit = max(1, min($limit, 200));

        $sql = 'SELECT id, name, slug, category, price_ks, image_url, stock, is_active FROM products WHERE is_active = 1';
        $params = [];

        if ($category !== '') {
            $sql .= ' AND category = :category';
            $params['category'] = $category;
        }

        if ($search !== '') {
            $sql .= ' AND name LIKE :search';
            $params['search'] = '%' . $search . '%';
        }

        $sql .= ' ORDER BY id LIMIT :limit OFFSET :offset';

        $db = Database::connection();
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
        $stmt = $db->prepare('SELECT id, name, slug, category, price_ks, image_url, stock, description, is_active FROM products WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);

        $product = $stmt->fetch();
        if (!$product) {
            Response::json(['success' => false, 'message' => 'product not found'], 404);
            return;
        }

        $this->ok(['product' => $product]);
    }
}
