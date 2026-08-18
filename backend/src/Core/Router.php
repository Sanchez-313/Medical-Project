<?php

declare(strict_types=1);

namespace App\Core;

use Closure;

final class Router
{
    /** @var array<int, array{method: string, pattern: string, handler: Closure|array{string, string}}> */
    private array $routes = [];

    public function get(string $pattern, Closure|array $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, Closure|array $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function patch(string $pattern, Closure|array $handler): void
    {
        $this->add('PATCH', $pattern, $handler);
    }

    public function delete(string $pattern, Closure|array $handler): void
    {
        $this->add('DELETE', $pattern, $handler);
    }

    private function add(string $method, string $pattern, Closure|array $handler): void
    {
        $this->routes[] = [
            'method' => $method,
            'pattern' => '#^' . preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $pattern) . '$#',
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method()) {
                continue;
            }

            if (!preg_match($route['pattern'], $request->path(), $matches)) {
                continue;
            }

            $params = [];
            foreach ($matches as $key => $value) {
                if (!is_int($key)) {
                    $params[$key] = $value;
                }
            }

            $handler = $route['handler'];

            if ($handler instanceof Closure) {
                $handler($request, $params);
                return;
            }

            [$class, $method] = $handler;
            $controller = new $class();
            $controller->$method($request, $params);
            return;
        }

        Response::json([
            'success' => false,
            'message' => 'Route not found',
        ], 404);
    }
}
