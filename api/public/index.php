<?php

declare(strict_types=1);

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $file = __DIR__ . '/../src/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

use App\Http\Cors;
use App\Http\Router;

Cors::apply();

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$query = [];
parse_str(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_QUERY) ?? '', $query);
$rawBody = file_get_contents('php://input') ?: '';

$headers = [];
foreach ($_SERVER as $key => $value) {
    if (str_starts_with((string) $key, 'HTTP_')) {
        $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr((string) $key, 5)))));
        $headers[$name] = (string) $value;
    }
}

$response = Router::dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $path, $query, $headers, $rawBody);

http_response_code($response['status']);
header('Content-Type: ' . $response['contentType']);
if ($response['body'] !== '') {
    echo $response['body'];
}
