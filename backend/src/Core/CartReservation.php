<?php

declare(strict_types=1);

namespace App\Core;

use DateInterval;
use DateTimeImmutable;
use DateTimeZone;
use PDO;

final class CartReservation
{
    private const HOLD_MINUTES = 10;

    public static function holdMinutes(): int
    {
        return self::HOLD_MINUTES;
    }

    public static function releaseExpiredReservations(PDO $db, ?int $userId = null): int
    {
        $cutoff = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
            ->sub(new DateInterval('PT' . self::HOLD_MINUTES . 'M'))
            ->format('Y-m-d H:i:s');

        $sql = 'SELECT id, product_id, qty FROM cart_items WHERE updated_at <= :cutoff';
        $params = ['cutoff' => $cutoff];

        if ($userId !== null) {
            $sql .= ' AND user_id = :user_id';
            $params['user_id'] = $userId;
        }

        $selectStmt = $db->prepare($sql);
        $selectStmt->execute($params);
        $expiredItems = $selectStmt->fetchAll();

        if ($expiredItems === []) {
            return 0;
        }

        $ownsTransaction = !$db->inTransaction();
        if ($ownsTransaction) {
            $db->beginTransaction();
        }

        try {
            $deleteStmt = $db->prepare('DELETE FROM cart_items WHERE id = :id');

            foreach ($expiredItems as $item) {
                Stock::adjustAvailableStock($db, (int) $item['product_id'], (int) $item['qty']);
                $deleteStmt->execute(['id' => (int) $item['id']]);
            }

            if ($ownsTransaction) {
                $db->commit();
            }

            return count($expiredItems);
        } catch (\Throwable $e) {
            if ($ownsTransaction && $db->inTransaction()) {
                $db->rollBack();
            }

            throw $e;
        }
    }
}
