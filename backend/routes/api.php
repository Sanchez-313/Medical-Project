<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\CartController;
use App\Controllers\CustomerController;
use App\Controllers\DeliveryController;
use App\Controllers\InquiryController;
use App\Controllers\InventoryController;
use App\Controllers\OrderController;
use App\Controllers\ProductController;
use App\Controllers\ReviewController;
use App\Core\Database;
use App\Core\Response;
use App\Core\Router;

/** @var Router $router */

$router->get('/api/health', function (): void {
    $db = Database::healthCheck();
    $status = $db['status'] === 'ok' ? 'ok' : 'degraded';
    Response::json([
        'success' => true,
        'data' => [
            'service' => 'medical-backend',
            'status' => $status,
            'timestamp' => date(DATE_ATOM),
            'db' => $db,
        ],
    ]);
});

$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login', [AuthController::class, 'login']);

$router->get('/api/products', [ProductController::class, 'index']);
$router->get('/api/products/{id}', [ProductController::class, 'show']);
$router->post('/api/products/detected', [ProductController::class, 'upsertDetected']);

$router->get('/api/cart', [CartController::class, 'index']);
$router->delete('/api/cart', [CartController::class, 'clear']);
$router->post('/api/cart/items', [CartController::class, 'store']);
$router->patch('/api/cart/items/{productId}', [CartController::class, 'update']);
$router->delete('/api/cart/items/{productId}', [CartController::class, 'destroy']);

$router->get('/api/customers', [CustomerController::class, 'index']);
$router->post('/api/customers', [CustomerController::class, 'store']);

$router->get('/api/inventory', [InventoryController::class, 'index']);
$router->patch('/api/inventory/{id}', [InventoryController::class, 'update']);

$router->get('/api/deliveries', [DeliveryController::class, 'index']);
$router->patch('/api/deliveries/{id}', [DeliveryController::class, 'update']);

$router->post('/api/orders', [OrderController::class, 'store']);
$router->get('/api/orders', [OrderController::class, 'index']);
$router->get('/api/orders/{id}', [OrderController::class, 'show']);

$router->post('/api/inquiries', [InquiryController::class, 'store']);
$router->get('/api/reviews', [ReviewController::class, 'index']);
$router->post('/api/reviews', [ReviewController::class, 'store']);
