<?php

// Usado apenas pelo servidor embutido do PHP (`php -S`, veja Dockerfile).
// Deixa arquivos estáticos existentes em public/ serem servidos normalmente
// e direciona todo o resto (rotas da API) para o front controller.
$uri = urldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
if ($uri !== '/' && is_file(__DIR__ . $uri)) {
    return false;
}
require __DIR__ . '/index.php';
