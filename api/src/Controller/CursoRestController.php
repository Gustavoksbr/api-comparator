<?php

namespace App\Controller;

use App\Domain\Curso;
use App\Domain\CursoParaAtualizar;
use App\Domain\CursoService;
use App\Domain\Exceptions\CursoNaoEncontrado;
use App\Domain\Exceptions\Erro409;
use App\Domain\Exceptions\ErroDeRequisicaoGeral;
use App\Domain\Exceptions\LimiteDoSandboxExcedido;
use App\Domain\Exceptions\NenhumCursoEncontrado;
use App\Domain\Instrutor;
use App\Domain\Modulo;
use App\Domain\Nivel;

/**
 * Equivalente ao CursoRestController do backend Java: recebe a requisição HTTP,
 * delega a regra de negócio ao CursoService e traduz o resultado (ou exceção) em
 * uma resposta HTTP com o status code apropriado.
 */
class CursoRestController
{
    public function __construct(private CursoService $cursoService)
    {
    }

    /** @param string[] $segments segmentos do path após "/cursos", ex.: ["c1"] */
    public function handle(string $method, array $segments, array $query, string $rawBody): array
    {
        try {
            $codigo = $segments[0] ?? null;

            if ($method === 'GET' && $codigo === null) {
                return $this->listar($query);
            }
            if ($method === 'GET' && $codigo !== null) {
                $curso = $this->cursoService->findByCodigo($codigo);
                $campos = $this->camposPedidos($query);
                return $this->jsonOk($campos === null ? $curso->toArray() : $curso->projetar($campos));
            }
            if ($method === 'POST' && $codigo === null) {
                return $this->criar($rawBody);
            }
            if ($method === 'PUT') {
                return $this->atualizar($codigo, $rawBody);
            }
            if ($method === 'DELETE' && $codigo !== null) {
                $this->cursoService->delete($codigo);
                return ['status' => 204, 'body' => '', 'contentType' => 'application/json'];
            }

            return $this->textError(405, 'Método HTTP não permitido para esta URL.');
        } catch (ErroDeRequisicaoGeral $e) {
            return $this->textError(400, $e->getMessage());
        } catch (NenhumCursoEncontrado|CursoNaoEncontrado $e) {
            return $this->textError(404, $e->getMessage());
        } catch (Erro409 $e) {
            return $this->textError(409, $e->getMessage());
        } catch (LimiteDoSandboxExcedido $e) {
            return $this->textError(429, $e->getMessage());
        } catch (\Throwable $e) {
            error_log('Erro 500: ' . $e);
            return $this->textError(500, 'Erro interno no servidor.');
        }
    }

    private function listar(array $query): array
    {
        $titulo = $query['titulo'] ?? null;
        $descricao = $query['descricao'] ?? null;
        $min = isset($query['minCargaHoraria']) ? (int) $query['minCargaHoraria'] : null;
        $max = isset($query['maxCargaHoraria']) ? (int) $query['maxCargaHoraria'] : null;

        if ($titulo !== null || $descricao !== null || $min !== null || $max !== null) {
            $cursos = $this->cursoService->findByParametros($titulo, $descricao, $min, $max);
        } else {
            $cursos = $this->cursoService->findAll();
        }

        $campos = $this->camposPedidos($query);

        return $this->jsonOk(array_map(
            fn (Curso $c) => $campos === null ? $c->toArray() : $c->projetar($campos),
            $cursos,
        ));
    }

    private function criar(string $rawBody): array
    {
        $data = $this->decodeJson($rawBody);
        $curso = new Curso(
            codigo: (string) ($data['codigo'] ?? ''),
            titulo: (string) ($data['titulo'] ?? ''),
            descricao: (string) ($data['descricao'] ?? ''),
            cargaHoraria: isset($data['cargaHoraria']) ? (int) $data['cargaHoraria'] : null,
            nivel: Nivel::de((string) ($data['nivel'] ?? Nivel::INICIANTE->value)),
            preco: (float) ($data['preco'] ?? 0),
            ativo: (bool) ($data['ativo'] ?? true),
            // criadoEm/atualizadoEm são derivados: o servidor os define (fica
            // "agora" por omissão no construtor de Curso), e o que o cliente
            // mandar aqui é ignorado de propósito.
            tags: $this->tags($data['tags'] ?? []),
            instrutor: $this->instrutor($data['instrutor'] ?? []),
            modulos: $this->modulos($data['modulos'] ?? []),
        );
        $criado = $this->cursoService->create($curso);
        return ['status' => 201, 'body' => json_encode($criado->toArray(), JSON_UNESCAPED_UNICODE), 'contentType' => 'application/json'];
    }

    private function atualizar(?string $codigo, string $rawBody): array
    {
        if ($codigo === null) {
            return $this->textError(400, "Precisa informar o path variable: {codigo}");
        }
        $data = $this->decodeJson($rawBody);
        $cursoParaAtualizar = new CursoParaAtualizar(
            codigo: $codigo,
            codigoNovo: $this->textoOuNull($data, 'codigoNovo'),
            titulo: $this->textoOuNull($data, 'titulo'),
            descricao: $this->textoOuNull($data, 'descricao'),
            cargaHoraria: isset($data['cargaHoraria']) ? (int) $data['cargaHoraria'] : null,
            nivel: isset($data['nivel']) ? Nivel::de((string) $data['nivel']) : null,
            preco: isset($data['preco']) ? (float) $data['preco'] : null,
            ativo: isset($data['ativo']) ? (bool) $data['ativo'] : null,
            tags: isset($data['tags']) ? $this->tags($data['tags']) : null,
            instrutor: isset($data['instrutor']) ? $this->instrutor($data['instrutor']) : null,
            modulos: isset($data['modulos']) ? $this->modulos($data['modulos']) : null,
        );
        $atualizado = $this->cursoService->update($cursoParaAtualizar);
        return $this->jsonOk($atualizado->toArray());
    }

    /** @return string[] */
    private function tags(mixed $bruto): array
    {
        if (is_string($bruto)) {
            $bruto = explode(',', $bruto);
        }
        return array_values(array_filter(
            array_map(static fn (mixed $t): string => trim((string) $t), (array) $bruto),
            static fn (string $t): bool => $t !== '',
        ));
    }

    private function instrutor(mixed $bruto): Instrutor
    {
        return Instrutor::fromArray((array) $bruto);
    }

    /** @return Modulo[] */
    private function modulos(mixed $bruto): array
    {
        $itens = array_values(array_filter((array) $bruto, 'is_array'));
        return array_values(array_map(
            // Ordem implícita pela posição quando o cliente não informa.
            static fn (int $i): Modulo => new Modulo(
                (int) ($itens[$i]['ordem'] ?? $i + 1),
                (string) ($itens[$i]['titulo'] ?? ''),
                (int) ($itens[$i]['duracaoMinutos'] ?? 0),
            ),
            array_keys($itens),
        ));
    }

    /**
     * Lê `?campos=codigo,instrutor.nome`. null = todos, o comportamento
     * default e o que produz o over-fetching que o Wire log mede.
     *
     * @return string[]|null
     */
    private function camposPedidos(array $query): ?array
    {
        $bruto = $query['campos'] ?? null;
        if ($bruto === null || trim($bruto) === '') {
            return null;
        }
        $pedidos = array_values(array_filter(
            array_map('trim', explode(',', $bruto)),
            static fn (string $c): bool => $c !== '',
        ));
        return $pedidos === [] ? null : $pedidos;
    }

    private function textoOuNull(array $dados, string $chave): ?string
    {
        if (!isset($dados[$chave])) {
            return null;
        }
        $valor = trim((string) $dados[$chave]);
        return $valor === '' ? null : $valor;
    }

    private function decodeJson(string $rawBody): array
    {
        if (trim($rawBody) === '') {
            return [];
        }
        $data = json_decode($rawBody, true);
        if (!is_array($data)) {
            throw new ErroDeRequisicaoGeral('Corpo da requisição inválido: JSON malformado.');
        }
        return $data;
    }

    private function jsonOk(array $body): array
    {
        return ['status' => 200, 'body' => json_encode($body, JSON_UNESCAPED_UNICODE), 'contentType' => 'application/json'];
    }

    private function textError(int $status, string $message): array
    {
        return ['status' => $status, 'body' => $message, 'contentType' => 'text/plain; charset=utf-8'];
    }
}
