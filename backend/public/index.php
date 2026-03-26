<?php

declare(strict_types=1);

use App\Core\Request;
use App\Core\Response;
use App\Core\Router;

require_once __DIR__ . '/../src/Core/bootstrap.php';
load_env(__DIR__ . '/../.env');

$appConfig = config('app');

$originHeader = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = array_filter(array_map('trim', explode(',', (string) $appConfig['frontend_origin'])));
$isAllowedOrigin = $originHeader && in_array($originHeader, $allowedOrigins, true);
$corsOrigin = $isAllowedOrigin ? $originHeader : ($allowedOrigins[0] ?? '');
if ($corsOrigin !== '') {
    header('Access-Control-Allow-Origin: ' . $corsOrigin);
}
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    Response::noContent();
    exit;
}

$request = Request::capture();
$router = new Router();

require __DIR__ . '/../routes/api.php';
$router->dispatch($request);
