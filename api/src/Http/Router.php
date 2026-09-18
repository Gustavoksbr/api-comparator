<?php

namespace App\Http;

use App\Controller\CursoGraphqlController;
use App\Controller\CursoRestController;
use App\Controller\CursoSoapController;
use App\Domain\CursoService;
use App\Domain\CursoValidator;
use App\Persistencia\Deposito;
use App\Persistencia\DepositoEmArquivo;
use App\Persistencia\DepositoEmMemoria;
use App\Sandbox\Armazenamento;
use App\Sandbox\Sandboxes;
use App\Wire\Registro;
use App\Wire\WireLog;

class Router
{
    /** @param array<string,string> $headers */
    public static function dispatch(string $method, string $path, array $query, array $headers, string $rawBody): array
    {
        $inicio = hrtime(true);
        $sandboxId = self::sandboxIdDe($headers);
        $path = '/' . trim($path, '/');

        $resposta = self::despachar($method, $path, $query, $sandboxId, $rawBody);

        self::medir($sandboxId, $method, $path, $query, $rawBody, $resposta, (hrtime(true) - $inicio) / 1_000_000);

        return $resposta;
    }

    private static function despachar(string $method, string $path, array $query, string $sandboxId, string $rawBody): array
    {
        if ($path === '/ping') {
            return ['status' => 200, 'body' => 'teste - ' . (int) (microtime(true) * 1000), 'contentType' => 'text/plain; charset=utf-8'];
        }

        $sandboxes = new Sandboxes(new Armazenamento(self::depositoPadrao('sandboxes')));

        if ($path === '/_sandbox/reset') {
            if ($method !== 'POST') {
                return self::metodoNaoPermitido();
            }
            $cursos = array_map(fn ($c) => $c->toArray(), $sandboxes->resetar($sandboxId)->findAll());
            return ['status' => 200, 'body' => json_encode($cursos, JSON_UNESCAPED_UNICODE), 'contentType' => 'application/json'];
        }

        if ($path === '/_wire') {
            return self::wire($method, $sandboxId);
        }

        $service = new CursoService($sandboxes->para($sandboxId), new CursoValidator());

        if ($path === '/cursos' || str_starts_with($path, '/cursos/')) {
            $rest = substr($path, strlen('/cursos'));
            $segments = array_values(array_filter(explode('/', trim($rest, '/')), fn ($s) => $s !== ''));
            return (new CursoRestController($service))->handle($method, $segments, $query, $rawBody);
        }

        if ($path === '/graphql') {
            if ($method !== 'POST') {
                return self::metodoNaoPermitido();
            }
            return (new CursoGraphqlController($service))->handle($rawBody);
        }

        if ($path === '/ws' || str_starts_with($path, '/ws/')) {
            if ($method !== 'POST') {
                return self::metodoNaoPermitido();
            }
            return (new CursoSoapController($service))->handle($rawBody);
        }

        return ['status' => 404, 'body' => 'Erro 404: URL não encontrada.', 'contentType' => 'text/plain; charset=utf-8'];
    }

    /** GET devolve o log deste sandbox; DELETE o zera (sem esperar o TTL do próprio sandbox de cursos). */
    private static function wire(string $method, string $sandboxId): array
    {
        $wire = new WireLog(self::depositoPadrao('wire'));

        if ($method === 'GET') {
            $body = [
                'sandbox' => $sandboxId,
                'resumoPorLeg' => $wire->resumoPorLeg($sandboxId),
                'registros' => array_map(static fn (Registro $r) => $r->paraPainel(), $wire->de($sandboxId)),
            ];
            return ['status' => 200, 'body' => json_encode($body, JSON_UNESCAPED_UNICODE), 'contentType' => 'application/json'];
        }
        if ($method === 'DELETE') {
            $wire->limpar($sandboxId);
            return ['status' => 204, 'body' => '', 'contentType' => 'application/json'];
        }
        return self::metodoNaoPermitido();
    }

    private static function metodoNaoPermitido(): array
    {
        return ['status' => 405, 'body' => 'Método HTTP não permitido para esta URL.', 'contentType' => 'text/plain; charset=utf-8'];
    }

    /**
     * Mede a requisição e registra no Wire log deste sandbox — a razão pela
     * qual o comparador não pode ser 100% frontend (veja Wire\WireLog).
     * `/ping` e o próprio `/_wire` ficam de fora para não poluir as métricas
     * com meta-rotas que não são um dos três legs comparados.
     */
    private static function medir(string $sandboxId, string $method, string $path, array $query, string $rawBody, array $resposta, float $duracaoMs): void
    {
        $leg = self::legDe($path);
        if ($leg === 'meta') {
            return;
        }

        [$camposPedidos, $camposRecebidos] = self::camposDe($leg, $query, $rawBody, $resposta);

        $bytesRequest = strlen($method . ' ' . $path . " HTTP/1.1\r\n") + strlen($rawBody);
        $bytesResponse = strlen((string) ($resposta['body'] ?? ''));
        $bytesComprimido = \extension_loaded('zlib')
            ? strlen((string) gzencode((string) ($resposta['body'] ?? ''), 6))
            : 0;

        $wire = new WireLog(self::depositoPadrao('wire'));
        $wire->registrar($sandboxId, new Registro(
            leg: $leg,
            casoDeUso: $method . ' ' . $path,
            metodo: $method,
            caminho: $path . ($query === [] ? '' : '?' . http_build_query($query)),
            status: $resposta['status'],
            bytesRequest: $bytesRequest,
            bytesResponse: $bytesResponse,
            bytesResponseComprimido: $bytesComprimido,
            duracaoMs: $duracaoMs,
            camposPedidos: $camposPedidos,
            camposRecebidos: $camposRecebidos,
            em: time(),
        ));
    }

    private static function legDe(string $path): string
    {
        if ($path === '/cursos' || str_starts_with($path, '/cursos/')) {
            return 'REST';
        }
        if ($path === '/graphql') {
            return 'GraphQL';
        }
        if ($path === '/ws' || str_starts_with($path, '/ws/')) {
            return 'SOAP';
        }
        return 'meta';
    }

    /**
     * "Campos pedidos" significa uma coisa em cada leg: no REST é o `?campos=`
     * (convenção deste projeto, sem contrato nenhum). No GraphQL é a própria
     * seleção da query. No SOAP é sempre `null`, e de propósito — document/
     * literal wrapped não tem seleção de campos, toda operação devolve o tipo
     * inteiro que o contrato declara. `null` aqui é o dado: o painel mostra
     * "SOAP não tem como pedir menos" ao lado do número do REST/GraphQL.
     *
     * @return array{0: int|null, 1: int|null}
     */
    private static function camposDe(string $leg, array $query, string $rawBody, array $resposta): array
    {
        $sucesso = $resposta['status'] < 400;

        if ($leg === 'GraphQL') {
            $texto = CursoGraphqlController::extractQueryText($rawBody);
            $pedidos = CursoGraphqlController::contarCamposSelecionados($texto);
            $recebidos = $sucesso ? CursoGraphqlController::contarCamposRecebidos((string) ($resposta['body'] ?? '')) : null;
            return [$pedidos, $recebidos];
        }

        if ($leg === 'REST') {
            $bruto = $query['campos'] ?? null;
            $pedidos = ($bruto === null || trim($bruto) === '')
                ? null
                : count(array_filter(array_map('trim', explode(',', $bruto)), static fn (string $c): bool => $c !== ''));

            $recebidos = null;
            if ($sucesso && ($resposta['body'] ?? '') !== '') {
                $decoded = json_decode((string) $resposta['body'], true);
                if (is_array($decoded)) {
                    $primeiro = array_is_list($decoded) ? ($decoded[0] ?? null) : $decoded;
                    $recebidos = is_array($primeiro) ? count($primeiro) : null;
                }
            }
            return [$pedidos, $recebidos];
        }

        return [null, null];
    }

    /**
     * O id do sandbox vem do cliente, num header (X-Session-Id).
     *
     * Sem login, sem cookie, sem dado pessoal: é um id que o front gera no
     * primeiro acesso (guardado no localStorage) e que identifica um sandbox
     * descartável, não uma pessoa. Normalizado para caber num nome de arquivo
     * sem surpresa (veja Persistencia\DepositoEmArquivo).
     *
     * @param array<string,string> $headers
     */
    private static function sandboxIdDe(array $headers): string
    {
        $bruto = $headers['X-Session-Id'] ?? $headers['x-session-id'] ?? '';
        $limpo = preg_replace('/[^A-Za-z0-9_-]/', '', $bruto) ?? '';

        return $limpo === '' ? 'anonimo' : substr($limpo, 0, 64);
    }

    /**
     * Uma decisão só, herdada pelo sandbox de cursos e pelo Wire log.
     *
     * Sob um runtime com worker mode real (o processo sobrevive entre
     * requisições) o array em memória é o caminho certo. Fora dele — o caso
     * do `php -S` usado no Dockerfile deste projeto —, um array estático não
     * sobreviveria à requisição: o sandbox pareceria sempre recém-semeado, e o
     * Wire log, sempre vazio. Daí o fallback em arquivo, que é o efetivamente
     * usado em produção aqui.
     */
    private static function driverEscolhido(): string
    {
        return getenv('SANDBOX_DRIVER') ?: (self::emWorkerMode() ? 'memoria' : 'arquivo');
    }

    private static function depositoPadrao(string $espaco): Deposito
    {
        return self::driverEscolhido() === 'memoria'
            ? new DepositoEmMemoria($espaco)
            : new DepositoEmArquivo(sys_get_temp_dir() . '/api-comparator/' . $espaco);
    }

    public static function emWorkerMode(): bool
    {
        return \function_exists('frankenphp_handle_request');
    }
}
