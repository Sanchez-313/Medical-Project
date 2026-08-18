<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Response;

abstract class Controller
{
    protected function badRequest(string $message): void
    {
        Response::json([
            'success' => false,
            'message' => $message,
        ], 400);
    }

    protected function ok(array $data, int $status = 200): void
    {
        Response::json([
            'success' => true,
            'data' => $data,
        ], $status);
    }
}
