<?php

declare(strict_types=1);

return [
    'app_name' => env_value('APP_NAME', 'Medical Backend'),
    'app_env' => env_value('APP_ENV', 'local'),
    'app_key' => env_value('APP_KEY', 'change-this-key-before-production'),
    'token_ttl_minutes' => (int) env_value('TOKEN_TTL_MINUTES', '720'),
    'frontend_origin' => env_value('FRONTEND_ORIGIN', 'http://localhost:5173'),
];
