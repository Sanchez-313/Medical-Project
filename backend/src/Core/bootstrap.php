<?php

declare(strict_types=1);

function env_value(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    return $value === false ? $default : ($value !== null ? (string) $value : $default);
}

function load_env(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        [$name, $value] = array_pad(explode('=', $line, 2), 2, '');
        $name = trim($name);
        $value = trim($value, " \t\n\r\0\x0B\"");

        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
        putenv("{$name}={$value}");
    }
}

function config(string $file): array
{
    $path = __DIR__ . '/../../config/' . $file . '.php';
    if (!is_file($path)) {
        throw new RuntimeException("Config file not found: {$file}");
    }

    /** @var array $cfg */
    $cfg = require $path;
    return $cfg;
}

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
    $path = __DIR__ . '/../' . $relative . '.php';
    if (is_file($path)) {
        require_once $path;
    }
});
