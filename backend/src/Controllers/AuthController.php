<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

final class AuthController extends Controller
{
    public function register(Request $request): void
    {
        $name = trim((string) $request->body('name', ''));
        $email = strtolower(trim((string) $request->body('email', '')));
        $password = (string) $request->body('password', '');
        $role = (string) $request->body('role', 'customer');

        if ($name === '' || $email === '' || strlen($password) < 6) {
            $this->badRequest('name, email and password(min 6) are required');
            return;
        }

        if (!in_array($role, ['customer', 'staff', 'admin'], true)) {
            $this->badRequest('invalid role');
            return;
        }

        $db = Database::connection();

        $stmt = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            Response::json(['success' => false, 'message' => 'email already exists'], 409);
            return;
        }

        $insert = $db->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password_hash, :role)');
        $insert->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'role' => $role,
        ]);

        $id = (int) $db->lastInsertId();
        $token = Auth::issueToken($id, $role);

        $this->ok([
            'token' => $token,
            'user' => ['id' => $id, 'name' => $name, 'email' => $email, 'role' => $role],
        ], 201);
    }

    public function login(Request $request): void
    {
        $email = strtolower(trim((string) $request->body('email', '')));
        $password = (string) $request->body('password', '');

        $db = Database::connection();
        $stmt = $db->prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, (string) $user['password_hash'])) {
            Response::json(['success' => false, 'message' => 'invalid credentials'], 401);
            return;
        }

        $token = Auth::issueToken((int) $user['id'], (string) $user['role']);

        $this->ok([
            'token' => $token,
            'user' => [
                'id' => (int) $user['id'],
                'name' => (string) $user['name'],
                'email' => (string) $user['email'],
                'role' => (string) $user['role'],
            ],
        ]);
    }
}
