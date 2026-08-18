<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

final class CustomerController extends Controller
{
    private function hasCustomerUserId(\PDO $db): bool
    {
        $driver = (string) $db->getAttribute(\PDO::ATTR_DRIVER_NAME);
        if ($driver === 'sqlite') {
            $stmt = $db->query("PRAGMA table_info(customers)");
            $rows = $stmt ? $stmt->fetchAll() : [];
            foreach ($rows as $row) {
                if (($row['name'] ?? '') === 'user_id') {
                    return true;
                }
            }
            return false;
        }

        $stmt = $db->prepare("SHOW COLUMNS FROM customers LIKE 'user_id'");
        $stmt->execute();
        return (bool) $stmt->fetch();
    }

    private function syncCustomersFromUsers(\PDO $db): void
    {
        $orders = $db->query(
            "SELECT
                u.id AS user_id,
                u.name,
                u.email,
                COALESCE(o.order_count, 0) AS order_count,
                o.last_order_at
             FROM users u
             LEFT JOIN (
                SELECT user_id, COUNT(*) AS order_count, MAX(created_at) AS last_order_at
                FROM orders
                WHERE user_id IS NOT NULL
                GROUP BY user_id
             ) o ON o.user_id = u.id
             WHERE u.role = 'customer'"
        )->fetchAll();

        if (!$orders) {
            return;
        }

        $findCustomer = $db->prepare('SELECT id, code, type FROM customers WHERE user_id = :user_id LIMIT 1');
        $updateCustomer = $db->prepare(
            'UPDATE customers SET name = :name, email = :email, role_label = :role_label, last_activity = :last_activity WHERE id = :id'
        );
        $insertCustomer = $db->prepare(
            'INSERT INTO customers (user_id, code, name, email, type, role_label, last_activity)
             VALUES (:user_id, :code, :name, :email, :type, :role_label, :last_activity)'
        );
        $codeExists = $db->prepare('SELECT 1 FROM customers WHERE code = :code LIMIT 1');

        foreach ($orders as $row) {
            $userId = (int) ($row['user_id'] ?? 0);
            $email = strtolower(trim((string) $row['email']));
            $name = trim((string) $row['name']);
            $count = (int) ($row['order_count'] ?? 0);
            if ($userId <= 0 || $email === '' || $name === '') {
                continue;
            }

            $findCustomer->execute(['user_id' => $userId]);
            $existing = $findCustomer->fetch();

            $roleLabel = $count >= 3 ? 'Returning Customer' : 'Customer';
            $lastActivity = $count > 0
                ? sprintf('Ordered %d time%s', $count, $count === 1 ? '' : 's')
                : 'Registered account';

            if ($existing) {
                if ($existing['type'] !== 'customers') {
                    continue;
                }
                $updateCustomer->execute([
                    'id' => (int) $existing['id'],
                    'name' => $name,
                    'email' => $email,
                    'role_label' => $roleLabel,
                    'last_activity' => $lastActivity,
                ]);
                continue;
            }

            do {
                $code = 'MED-' . random_int(1000, 9999);
                $codeExists->execute(['code' => $code]);
                $exists = (bool) $codeExists->fetchColumn();
            } while ($exists);

            $insertCustomer->execute([
                'user_id' => $userId,
                'code' => $code,
                'name' => $name,
                'email' => $email,
                'type' => 'customers',
                'role_label' => $roleLabel,
                'last_activity' => $lastActivity,
            ]);
        }
    }

    public function index(Request $request): void
    {
        $actor = Auth::requireRole($request, ['admin', 'staff']);
        if ($actor === null) {
            return;
        }

        $type = trim((string) $request->query('type', ''));
        $search = trim((string) $request->query('search', ''));

        $db = Database::connection();
        if ($this->hasCustomerUserId($db)) {
            $this->syncCustomersFromUsers($db);
        }

        $sql = 'SELECT id, code, name, email, type, role_label, last_activity FROM customers WHERE 1=1';
        $params = [];

        if ($type !== '') {
            $sql .= ' AND type = :type';
            $params['type'] = $type;
        }

        if ($search !== '') {
            $sql .= ' AND (name LIKE :search OR code LIKE :search OR email LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        $sql .= ' ORDER BY created_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $this->ok(['customers' => $stmt->fetchAll()]);
    }

    public function store(Request $request): void
    {
        $actor = Auth::requireRole($request, ['admin', 'staff']);
        if ($actor === null) {
            return;
        }

        $name = trim((string) $request->body('name', ''));
        $email = strtolower(trim((string) $request->body('email', '')));
        $type = (string) $request->body('type', 'customers');
        $roleLabel = trim((string) $request->body('roleLabel', 'Standard Customer'));

        if ($name === '' || $email === '') {
            $this->badRequest('name and email are required');
            return;
        }

        if (!in_array($type, ['customers', 'staff'], true)) {
            $this->badRequest('invalid type');
            return;
        }

        $prefix = $type === 'staff' ? 'STAFF-' : 'MED-';
        $code = $prefix . random_int($type === 'staff' ? 100 : 1000, $type === 'staff' ? 999 : 9999);

        $db = Database::connection();
        $stmt = $db->prepare('INSERT INTO customers (code, name, email, type, role_label, last_activity) VALUES (:code, :name, :email, :type, :role_label, :last_activity)');
        $stmt->execute([
            'code' => $code,
            'name' => $name,
            'email' => $email,
            'type' => $type,
            'role_label' => $roleLabel,
            'last_activity' => 'Just now',
        ]);

        $this->ok(['id' => (int) $db->lastInsertId(), 'code' => $code], 201);
    }
}
