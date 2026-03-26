<?php

declare(strict_types=1);

namespace App\Core;

final class Request
{
    public function __construct(
        private readonly string $method,
        private readonly string $path,
        private readonly array $query,
        private readonly array $headers,
        private readonly array $body
    ) {
    }

    public static function capture(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';

        $headers = function_exists('getallheaders') ? getallheaders() : [];
        if (!is_array($headers)) {
            $headers = [];
        }

        foreach ($_SERVER as $key => $value) {
            if (!is_string($value)) {
                continue;
            }

            if ($key === 'CONTENT_TYPE' || $key === 'CONTENT_LENGTH') {
                $headerName = str_replace('_', '-', $key);
                $headers[$headerName] = $value;
                continue;
            }

            if (!str_starts_with($key, 'HTTP_')) {
                continue;
            }

            $headerName = str_replace('_', '-', substr($key, 5));
            $headers[$headerName] = $value;
        }

        $raw = file_get_contents('php://input');
        $decoded = $raw ? json_decode($raw, true) : [];

        return new self(
            $method,
            $path,
            $_GET,
            array_change_key_case($headers, CASE_LOWER),
            is_array($decoded) ? $decoded : []
        );
    }

    public function method(): string
    {
        return $this->method;
    }

    public function path(): string
    {
        return $this->path;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function body(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    public function allBody(): array
    {
        return $this->body;
    }

    public function header(string $name, ?string $default = null): ?string
    {
        $value = $this->headers[strtolower($name)] ?? $default;
        return $value !== null ? (string) $value : null;
    }
}
