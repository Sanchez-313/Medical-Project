<?php

declare(strict_types=1);

$driver = env_value('DB_DRIVER', 'mysql');

return [
    'driver' => $driver,
    'sqlite' => [
        'path' => env_value('DB_SQLITE_PATH', __DIR__ . '/../database/app.sqlite'),
    ],
    'mysql' => [
        'host' => env_value('DB_HOST', '127.0.0.1'),
        'port' => (int) env_value('DB_PORT', '3306'),
        'database' => env_value('DB_NAME', 'medical_project'),
        'username' => env_value('DB_USER', 'root'),
        'password' => env_value('DB_PASS', ''),
        'charset' => env_value('DB_CHARSET', 'utf8mb4'),
    ],
];
