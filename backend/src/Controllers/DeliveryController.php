<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

final class DeliveryController extends Controller
{
    public function index(Request $request): void
    {
        $actor = Auth::requireRole($request, ['admin', 'staff']);
        if ($actor === null) {
            return;
        }

        $db = Database::connection();
        $stmt = $db->query(
            'SELECT
                d.id,
                d.order_code,
                d.hospital,
                d.courier,
                d.eta_text,
                d.progress,
                d.lat,
                d.lng,
                d.status,
                d.updated_at,
                o.shipping_name AS customer_name
             FROM deliveries d
             LEFT JOIN orders o ON o.order_code = REPLACE(d.order_code, "#", "")
             ORDER BY d.updated_at DESC'
        );

        $this->ok(['deliveries' => $stmt->fetchAll()]);
    }

    public function update(Request $request, array $params): void
    {
        $actor = Auth::requireRole($request, ['admin', 'staff']);
        if ($actor === null) {
            return;
        }

        $id = (int) ($params['id'] ?? 0);
        $eta = trim((string) $request->body('eta_text', ''));
        $progress = (int) $request->body('progress', 0);
        $status = trim((string) $request->body('status', 'in_transit'));

        if ($progress < 0 || $progress > 100) {
            $this->badRequest('eta_text and progress(0-100) are required');
            return;
        }

        if ($eta === '') {
            $eta = match ($status) {
                'queued' => 'Point သို့ မအပ်ရသေး',
                'in_transit' => 'Point သို့ အပ်ပြီး',
                'delivered' => 'Point ပို့ဆောင်ပြီး',
                'delayed' => 'Point နှောင့်နှေးနေသည်',
                default => 'Point သို့ မအပ်ရသေး',
            };
        }

        $db = Database::connection();
        $db->beginTransaction();

        try {
            $deliveryStmt = $db->prepare('SELECT order_code FROM deliveries WHERE id = :id LIMIT 1');
            $deliveryStmt->execute(['id' => $id]);
            $delivery = $deliveryStmt->fetch();

            if (!$delivery) {
                $db->rollBack();
                Response::json(['success' => false, 'message' => 'delivery not found'], 404);
                return;
            }

            $stmt = $db->prepare('UPDATE deliveries SET eta_text = :eta, progress = :progress, status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
            $stmt->execute([
                'id' => $id,
                'eta' => $eta,
                'progress' => $progress,
                'status' => $status,
            ]);

            $orderStatus = match ($status) {
                'delivered' => 'delivered',
                'delayed' => 'shipped',
                'in_transit' => 'shipped',
                default => 'confirmed',
            };

            $orderCode = ltrim((string) $delivery['order_code'], '#');
            $orderStmt = $db->prepare('UPDATE orders SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE order_code = :order_code');
            $orderStmt->execute([
                'status' => $orderStatus,
                'order_code' => $orderCode,
            ]);

            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            Response::json(['success' => false, 'message' => 'failed to update delivery'], 500);
            return;
        }

        $this->ok(['updated' => true]);
    }
}
