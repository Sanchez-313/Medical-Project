<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\CartReservation;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Core\Stock;

final class OrderController extends Controller
{
    public function index(Request $request): void
    {
        $payload = Auth::requireRole($request, ['customer', 'staff', 'admin']);
        if ($payload === null) {
            return;
        }

        $db = Database::connection();
        $sql = 'SELECT id, order_code, user_id, payment_method, shipping_name, shipping_email, shipping_phone, shipping_city, shipping_address, subtotal_ks, tax_ks, total_ks, status, created_at FROM orders';
        $params = [];

        if (!in_array($payload['role'], ['admin', 'staff'], true)) {
            $sql .= ' WHERE user_id = :user_id';
            $params['user_id'] = (int) $payload['sub'];
        }

        $sql .= ' ORDER BY id DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        if ($orders === []) {
            $this->ok(['orders' => []]);
            return;
        }

        $itemStmt = $db->prepare(
            'SELECT oi.order_id, oi.product_id, oi.qty, oi.unit_price_ks, oi.total_price_ks, p.name
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = :order_id'
        );

        $mapped = [];
        foreach ($orders as $order) {
            $itemStmt->execute(['order_id' => (int) $order['id']]);
            $items = array_map(static function (array $item): array {
                return [
                    'id' => (int) $item['product_id'],
                    'name' => (string) ($item['name'] ?? ('Product #' . $item['product_id'])),
                    'quantity' => (int) $item['qty'],
                    'unitPrice' => (int) $item['unit_price_ks'],
                    'totalPrice' => (int) $item['total_price_ks'],
                ];
            }, $itemStmt->fetchAll());

            $mapped[] = [
                'id' => (string) $order['order_code'],
                'createdAt' => (string) $order['created_at'],
                'paymentMethod' => (string) $order['payment_method'],
                'shipping' => [
                    'fullName' => (string) $order['shipping_name'],
                    'email' => (string) $order['shipping_email'],
                    'phone' => (string) $order['shipping_phone'],
                    'city' => (string) $order['shipping_city'],
                    'address' => (string) $order['shipping_address'],
                ],
                'items' => $items,
                'subtotal' => (int) $order['subtotal_ks'],
                'tax' => (int) $order['tax_ks'],
                'total' => (int) $order['total_ks'],
                'status' => (string) $order['status'],
            ];
        }

        $this->ok(['orders' => $mapped]);
    }

    public function store(Request $request): void
    {
        $payload = Auth::requireRole($request, ['customer', 'staff', 'admin']);
        if ($payload === null) {
            return;
        }

        $items = $request->body('items', []);
        $shipping = $request->body('shipping', []);
        $paymentMethod = trim((string) $request->body('payment_method', 'cod'));

        if (!is_array($items) || count($items) === 0 || !is_array($shipping)) {
            $this->badRequest('items and shipping are required');
            return;
        }

        $db = Database::connection();
        $db->beginTransaction();

        try {
            CartReservation::releaseExpiredReservations($db, (int) $payload['sub']);
            $subtotal = 0;
            foreach ($items as $item) {
                $productId = (int) ($item['product_id'] ?? 0);
                $qty = max(1, (int) ($item['qty'] ?? 1));

                $product = Stock::fetchActiveProduct($db, $productId);
                if (!$product) {
                    throw new \RuntimeException("Product {$productId} not found");
                }

                $reservedQty = Stock::reservedQty($db, (int) $payload['sub'], $productId);
                if (((int) $product['stock']) + $reservedQty < $qty) {
                    throw new \RuntimeException("Insufficient stock for product {$productId}");
                }

                $subtotal += (int) $product['price_ks'] * $qty;
            }

            $tax = (int) round($subtotal * 0.05);
            $total = $subtotal + $tax;
            $orderCode = 'ORD-' . random_int(100000, 999999);

            $orderStmt = $db->prepare('INSERT INTO orders (order_code, user_id, payment_method, shipping_name, shipping_email, shipping_phone, shipping_city, shipping_address, subtotal_ks, tax_ks, total_ks, status) VALUES (:order_code, :user_id, :payment_method, :name, :email, :phone, :city, :address, :subtotal, :tax, :total, :status)');
            $orderStmt->execute([
                'order_code' => $orderCode,
                'user_id' => (int) $payload['sub'],
                'payment_method' => $paymentMethod,
                'name' => (string) ($shipping['fullName'] ?? ''),
                'email' => (string) ($shipping['email'] ?? ''),
                'phone' => (string) ($shipping['phone'] ?? ''),
                'city' => (string) ($shipping['city'] ?? ''),
                'address' => (string) ($shipping['address'] ?? ''),
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'status' => 'pending',
            ]);

            $orderId = (int) $db->lastInsertId();

            $itemStmt = $db->prepare('INSERT INTO order_items (order_id, product_id, qty, unit_price_ks, total_price_ks) VALUES (:order_id, :product_id, :qty, :unit_price, :total_price)');
            $stockStmt = $db->prepare('UPDATE products SET stock = stock - :qty WHERE id = :id');
            $inventoryStockStmt = $db->prepare('UPDATE inventory_items SET stock = stock - :qty, updated_at = CURRENT_TIMESTAMP WHERE product_id = :id');

            foreach ($items as $item) {
                $productId = (int) $item['product_id'];
                $qty = max(1, (int) ($item['qty'] ?? 1));

                $product = Stock::fetchActiveProduct($db, $productId);
                $unitPrice = (int) $product['price_ks'];
                $reservedQty = Stock::reservedQty($db, (int) $payload['sub'], $productId);

                $itemStmt->execute([
                    'order_id' => $orderId,
                    'product_id' => $productId,
                    'qty' => $qty,
                    'unit_price' => $unitPrice,
                    'total_price' => $unitPrice * $qty,
                ]);

                $remainingReservedQty = max(0, $reservedQty - $qty);
                if ($reservedQty > 0) {
                    if ($remainingReservedQty > 0) {
                        $cartUpdateStmt = $db->prepare(
                            'UPDATE cart_items
                             SET qty = :qty, updated_at = CURRENT_TIMESTAMP
                             WHERE user_id = :user_id AND product_id = :product_id'
                        );
                        $cartUpdateStmt->execute([
                            'qty' => $remainingReservedQty,
                            'user_id' => (int) $payload['sub'],
                            'product_id' => $productId,
                        ]);
                    } else {
                        $cartDeleteStmt = $db->prepare(
                            'DELETE FROM cart_items WHERE user_id = :user_id AND product_id = :product_id'
                        );
                        $cartDeleteStmt->execute([
                            'user_id' => (int) $payload['sub'],
                            'product_id' => $productId,
                        ]);
                    }
                }

                $additionalQty = max(0, $qty - $reservedQty);
                if ($additionalQty > 0) {
                    $stockStmt->execute(['id' => $productId, 'qty' => $additionalQty]);
                    $inventoryStockStmt->execute(['id' => $productId, 'qty' => $additionalQty]);
                }
            }

            $deliveryStmt = $db->prepare(
                'INSERT INTO deliveries (order_code, hospital, courier, eta_text, progress, lat, lng, status)
                 VALUES (:order_code, :hospital, :courier, :eta_text, :progress, :lat, :lng, :status)'
            );
            $deliveryStmt->execute([
                'order_code' => $orderCode,
                'hospital' => (string) ($shipping['address'] ?? 'Delivery Address'),
                'courier' => 'Point',
                'eta_text' => 'Point သို့ မအပ်ရသေး',
                'progress' => 10,
                'lat' => null,
                'lng' => null,
                'status' => 'queued',
            ]);

            $db->commit();

            $this->ok([
                'order_id' => $orderId,
                'order_code' => $orderCode,
                'subtotal_ks' => $subtotal,
                'tax_ks' => $tax,
                'total_ks' => $total,
                'status' => 'pending',
            ], 201);
        } catch (\Throwable $e) {
            $db->rollBack();
            Response::json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(Request $request, array $params): void
    {
        $payload = Auth::requireRole($request, ['customer', 'staff', 'admin']);
        if ($payload === null) {
            return;
        }

        $id = (int) ($params['id'] ?? 0);
        $db = Database::connection();

        $stmt = $db->prepare('SELECT id, order_code, user_id, payment_method, shipping_name, shipping_phone, shipping_city, shipping_address, subtotal_ks, tax_ks, total_ks, status, created_at FROM orders WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::json(['success' => false, 'message' => 'order not found'], 404);
            return;
        }

        if ((int) $payload['sub'] !== (int) $order['user_id'] && !in_array($payload['role'], ['admin', 'staff'], true)) {
            Response::json(['success' => false, 'message' => 'forbidden'], 403);
            return;
        }

        $itemStmt = $db->prepare('SELECT product_id, qty, unit_price_ks, total_price_ks FROM order_items WHERE order_id = :order_id');
        $itemStmt->execute(['order_id' => $id]);

        $this->ok([
            'order' => $order,
            'items' => $itemStmt->fetchAll(),
        ]);
    }
}
