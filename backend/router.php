<?php

declare(strict_types=1);

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$documentRoot = __DIR__ . '/public';
$target = realpath($documentRoot . $requestPath);

if (
    $target !== false &&
    str_starts_with($target, realpath($documentRoot) ?: $documentRoot) &&
    is_file($target)
) {
    return false;
}

require $documentRoot . '/index.php';
