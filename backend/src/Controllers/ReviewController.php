<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;

final class ReviewController extends Controller
{
    public function index(Request $request): void
    {
        $limit = max(1, min(50, (int) $request->query('limit', 20)));
        $db = Database::connection();
        $stmt = $db->prepare(
            'SELECT id, name, email, rating, title, comment, status, created_at
             FROM reviews
             WHERE status = :status
             ORDER BY id DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':status', 'published');
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        $this->ok([
            'reviews' => $stmt->fetchAll(),
        ]);
    }

    public function store(Request $request): void
    {
        $name = trim((string) $request->body('name', ''));
        $email = strtolower(trim((string) $request->body('email', '')));
        $rating = (int) $request->body('rating', 0);
        $title = trim((string) $request->body('title', ''));
        $comment = trim((string) $request->body('comment', ''));

        if ($name === '' || $comment === '' || $rating < 1 || $rating > 5) {
            $this->badRequest('name, rating (1-5), and comment are required');
            return;
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO reviews (name, email, rating, title, comment, status)
             VALUES (:name, :email, :rating, :title, :comment, :status)'
        );
        $stmt->execute([
            'name' => $name,
            'email' => $email !== '' ? $email : null,
            'rating' => $rating,
            'title' => $title !== '' ? $title : null,
            'comment' => $comment,
            'status' => 'published',
        ]);

        $this->ok([
            'id' => (int) $db->lastInsertId(),
            'status' => 'published',
        ], 201);
    }
}
