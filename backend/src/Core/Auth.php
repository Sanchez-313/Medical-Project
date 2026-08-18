<?php

declare(strict_types=1);

namespace App\Core;

use DateTimeImmutable;

final class Auth
{
    public static function issueToken(int $userId, string $role): string
    {
        $cfg = config('app');
        $ttl = (int) $cfg['token_ttl_minutes'];

        $payload = [
            'sub' => $userId,
            'role' => $role,
            'exp' => (new DateTimeImmutable("+{$ttl} minutes"))->getTimestamp(),
        ];

        $encoded = base64_encode(json_encode($payload, JSON_UNESCAPED_SLASHES));
        $signature = hash_hmac('sha256', $encoded, $cfg['app_key']);

        return $encoded . '.' . $signature;
    }

    public static function validateToken(?string $token): ?array
    {
        if ($token === null || !str_contains($token, '.')) {
            return null;
        }

        [$encoded, $signature] = explode('.', $token, 2);
        $cfg = config('app');
        $expected = hash_hmac('sha256', $encoded, $cfg['app_key']);

        if (!hash_equals($expected, $signature)) {
            return null;
        }

        $payload = json_decode((string) base64_decode($encoded), true);
        if (!is_array($payload)) {
            return null;
        }

        if (($payload['exp'] ?? 0) < time()) {
            return null;
        }

        return $payload;
    }

    public static function bearerToken(Request $request): ?string
    {
        $header = $request->header('authorization');
        if (!$header || !str_starts_with(strtolower($header), 'bearer ')) {
            return null;
        }

        return trim(substr($header, 7));
    }

    public static function requireRole(Request $request, array $allowedRoles): ?array
    {
        $token = self::bearerToken($request);
        $payload = self::validateToken($token);

        if ($payload === null || !in_array($payload['role'] ?? '', $allowedRoles, true)) {
            Response::json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
            return null;
        }

        return $payload;
    }
}
