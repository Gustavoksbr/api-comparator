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

// Carrega api/.env (veja .env.example) para quem roda `php -S` localmente sem
// exportar as env vars manualmente. Uma env var real sempre tem prioridade.
$envFile = __DIR__ . '/../.env';
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linha) {
        $linha = trim($linha);
        if ($linha === '' || str_starts_with($linha, '#') || !str_contains($linha, '=')) {
            continue;
        }
        [$chave, $valor] = explode('=', $linha, 2);
        $chave = trim($chave);
        $valor = trim($valor);
        if (strlen($valor) >= 2 && $valor[0] === $valor[-1] && ($valor[0] === '"' || $valor[0] === "'")) {
            $valor = substr($valor, 1, -1);
        }
        if (getenv($chave) === false) {
            putenv("{$chave}={$valor}");
        }
    }
}

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
