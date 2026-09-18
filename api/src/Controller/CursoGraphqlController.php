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
 * Endpoint GraphQL "sob medida" para o schema em schema.graphqls (listCursos,
 * getCursoByCodigo, createCurso, updateCurso, deleteCurso). Não é um motor GraphQL
 * genérico (não resolve variáveis, fragmentos ou diretivas) — mas entende
 * argumentos e seleções ANINHADOS (objetos, listas de objetos, enums), o
 * suficiente para o schema deste projeto, incluindo `instrutor` e `modulos`.
 *
 * `criadoEm`/`atualizadoEm` são tratados como String (não como um scalar
 * `DataHora` customizado): implementar parseValue/parseLiteral/serialize por
 * scalar exigiria um motor GraphQL de verdade (é o que o ADR 0003 do projeto
 * de referência faz com webonyx/graphql-php), e essa dependência de composer
 * é exatamente o que este parser "sob medida" evita.
 *
 * O parsing (métodos `static`) não depende de nenhum estado de instância — é
 * por isso que Http\Router consegue reusá-lo (`contarCamposSelecionados`,
 * `contarCamposRecebidos`) para alimentar o Wire log sem precisar montar um
 * CursoService só para contar campos.
 */
class CursoGraphqlController
{
    public function __construct(private CursoService $cursoService)
    {
    }

    public function handle(string $rawBody): array
    {
        $query = self::extractQueryText($rawBody);

        try {
            [$opName, $args, $selection] = self::parseOperation($query);

            $data = match ($opName) {
                'listCursos' => array_map(
                    fn (Curso $c) => self::project($c, $selection),
                    empty($args)
                        ? $this->cursoService->findAll()
                        : $this->cursoService->findByParametros(
                            $args['titulo'] ?? null,
                            $args['descricao'] ?? null,
                            isset($args['minCargaHoraria']) ? (int) $args['minCargaHoraria'] : null,
                            isset($args['maxCargaHoraria']) ? (int) $args['maxCargaHoraria'] : null,
                        )
                ),
                'getCursoByCodigo' => self::project($this->cursoService->findByCodigo((string) ($args['codigo'] ?? '')), $selection),
                'createCurso' => self::project($this->cursoService->create(new Curso(
                    codigo: (string) ($args['codigo'] ?? ''),
                    titulo: (string) ($args['titulo'] ?? ''),
                    descricao: (string) ($args['descricao'] ?? ''),
                    cargaHoraria: isset($args['cargaHoraria']) ? (int) $args['cargaHoraria'] : null,
                    nivel: Nivel::de((string) ($args['nivel'] ?? Nivel::INICIANTE->value)),
                    preco: (float) ($args['preco'] ?? 0),
                    ativo: (bool) ($args['ativo'] ?? true),
                    tags: self::tags($args['tags'] ?? []),
                    instrutor: self::instrutor($args['instrutor'] ?? []),
                    modulos: self::modulos($args['modulos'] ?? []),
                )), $selection),
                'updateCurso' => self::project($this->cursoService->update(new CursoParaAtualizar(
                    codigo: $args['codigo'] ?? null,
                    codigoNovo: $args['codigoNovo'] ?? null,
                    titulo: $args['titulo'] ?? null,
                    descricao: $args['descricao'] ?? null,
                    cargaHoraria: isset($args['cargaHoraria']) ? (int) $args['cargaHoraria'] : null,
                    nivel: isset($args['nivel']) ? Nivel::de((string) $args['nivel']) : null,
                    preco: isset($args['preco']) ? (float) $args['preco'] : null,
                    ativo: isset($args['ativo']) ? (bool) $args['ativo'] : null,
                    tags: isset($args['tags']) ? self::tags($args['tags']) : null,
                    instrutor: isset($args['instrutor']) ? self::instrutor($args['instrutor']) : null,
                    modulos: isset($args['modulos']) ? self::modulos($args['modulos']) : null,
                )), $selection),
                'deleteCurso' => $this->deletar((string) ($args['codigo'] ?? '')),
                default => throw new ErroDeRequisicaoGeral("Operação GraphQL desconhecida: '{$opName}'"),
            };

            return self::ok([$opName => $data]);
        } catch (ErroDeRequisicaoGeral $e) {
            return self::error($e->getMessage(), 'BAD_REQUEST');
        } catch (NenhumCursoEncontrado|CursoNaoEncontrado $e) {
            return self::error($e->getMessage(), 'NOT_FOUND');
        } catch (Erro409 $e) {
            return self::error($e->getMessage(), 'CONFLICT');
        } catch (LimiteDoSandboxExcedido $e) {
            return self::error($e->getMessage(), 'TOO_MANY_REQUESTS');
        } catch (\Throwable $e) {
            error_log('Erro 500: ' . $e);
            return self::error('Erro interno no servidor.', 'INTERNAL_ERROR');
        }
    }

    private function deletar(string $codigo): bool
    {
        $this->cursoService->delete($codigo);
        return true;
    }

    // ==================================================================
    // Usados pelo Wire log (Http\Router) para medir over/under-fetching
    // sem duplicar o parser.
    // ==================================================================

    public static function contarCamposSelecionados(string $query): ?int
    {
        try {
            [, , $selection] = self::parseOperation($query);
            return $selection === null ? null : count($selection);
        } catch (\Throwable) {
            return null;
        }
    }

    public static function contarCamposRecebidos(string $responseBody): ?int
    {
        $decoded = json_decode($responseBody, true);
        if (!is_array($decoded) || !isset($decoded['data']) || !is_array($decoded['data'])) {
            return null;
        }

        $primeiro = reset($decoded['data']);
        if (is_array($primeiro) && array_is_list($primeiro)) {
            $primeiro = $primeiro[0] ?? null;
        }

        return is_array($primeiro) ? count($primeiro) : null;
    }

    public static function extractQueryText(string $rawBody): string
    {
        $decoded = json_decode($rawBody, true);
        if (is_array($decoded) && isset($decoded['query']) && is_string($decoded['query'])) {
            return $decoded['query'];
        }
        return $rawBody;
    }

    /** @return string[] */
    private static function tags(mixed $bruto): array
    {
        return array_values(array_map('strval', (array) $bruto));
    }

    private static function instrutor(mixed $bruto): Instrutor
    {
        return Instrutor::fromArray((array) $bruto);
    }

    /** @return Modulo[] */
    private static function modulos(mixed $bruto): array
    {
        $itens = array_values((array) $bruto);
        return array_values(array_map(
            static fn (int $i): Modulo => new Modulo(
                isset($itens[$i]['ordem']) ? (int) $itens[$i]['ordem'] : $i + 1,
                (string) ($itens[$i]['titulo'] ?? ''),
                (int) ($itens[$i]['duracaoMinutos'] ?? 0),
            ),
            array_keys($itens),
        ));
    }

    // ==================================================================
    // Parser: uma única operação (query|mutation) com um campo raiz,
    // argumentos que podem ser escalares, listas ou objetos aninhados
    // (recursivamente), e uma seleção de campos que pode ter subseleções.
    // ==================================================================

    /** @return array{0: string, 1: array<string, mixed>, 2: array<string, mixed>|null} */
    private static function parseOperation(string $query): array
    {
        $s = preg_replace('/^\s*(query|mutation)\b/i', '', $query) ?? $query;
        $pos = 0;

        self::skipWs($s, $pos);
        self::expect($s, $pos, '{');

        self::skipWs($s, $pos);
        $opName = self::parseBareWord($s, $pos);
        if ($opName === null) {
            throw new ErroDeRequisicaoGeral('Query GraphQL inválida: operação não encontrada.');
        }

        self::skipWs($s, $pos);
        $args = [];
        if (($s[$pos] ?? '') === '(') {
            $pos++;
            $args = self::parseArgList($s, $pos);
        }

        self::skipWs($s, $pos);
        $selection = null;
        if (($s[$pos] ?? '') === '{') {
            $pos++;
            $selection = self::parseSelectionSet($s, $pos);
        }

        return [$opName, $args, $selection];
    }

    /** @return array<string, mixed> */
    private static function parseArgList(string $s, int &$pos): array
    {
        $args = [];
        while (true) {
            self::skipWs($s, $pos);
            if (($s[$pos] ?? '') === ')') {
                $pos++;
                break;
            }
            if ($pos >= strlen($s)) {
                throw new ErroDeRequisicaoGeral('Query GraphQL inválida: argumentos sem fechamento.');
            }
            $name = self::parseBareWord($s, $pos);
            self::skipWs($s, $pos);
            self::expect($s, $pos, ':');
            $args[(string) $name] = self::parseValue($s, $pos);
            self::skipWs($s, $pos);
            if (($s[$pos] ?? '') === ',') {
                $pos++;
            }
        }
        return $args;
    }

    /** @return array<string, mixed> */
    private static function parseSelectionSet(string $s, int &$pos): array
    {
        $fields = [];
        while (true) {
            self::skipWs($s, $pos);
            if (($s[$pos] ?? '') === '}') {
                $pos++;
                break;
            }
            if ($pos >= strlen($s)) {
                throw new ErroDeRequisicaoGeral('Query GraphQL inválida: seleção sem fechamento.');
            }
            $name = self::parseBareWord($s, $pos);
            if ($name === null) {
                throw new ErroDeRequisicaoGeral('Query GraphQL inválida: campo de seleção esperado.');
            }
            self::skipWs($s, $pos);
            $sub = null;
            if (($s[$pos] ?? '') === '{') {
                $pos++;
                $sub = self::parseSelectionSet($s, $pos);
            }
            $fields[$name] = $sub;
        }
        return $fields;
    }

    private static function parseValue(string $s, int &$pos): mixed
    {
        self::skipWs($s, $pos);
        $c = $s[$pos] ?? '';

        if ($c === '"') {
            return self::parseString($s, $pos);
        }
        if ($c === '[') {
            $pos++;
            $list = [];
            while (true) {
                self::skipWs($s, $pos);
                if (($s[$pos] ?? '') === ']') {
                    $pos++;
                    break;
                }
                $list[] = self::parseValue($s, $pos);
                self::skipWs($s, $pos);
                if (($s[$pos] ?? '') === ',') {
                    $pos++;
                }
            }
            return $list;
        }
        if ($c === '{') {
            $pos++;
            $obj = [];
            while (true) {
                self::skipWs($s, $pos);
                if (($s[$pos] ?? '') === '}') {
                    $pos++;
                    break;
                }
                $key = self::parseBareWord($s, $pos) ?? self::parseString($s, $pos);
                self::skipWs($s, $pos);
                self::expect($s, $pos, ':');
                $obj[(string) $key] = self::parseValue($s, $pos);
                self::skipWs($s, $pos);
                if (($s[$pos] ?? '') === ',') {
                    $pos++;
                }
            }
            return $obj;
        }
        if ($c === '-' || ctype_digit($c)) {
            return self::parseNumber($s, $pos);
        }

        $word = self::parseBareWord($s, $pos);
        return match ($word) {
            'true' => true,
            'false' => false,
            'null' => null,
            default => $word, // enum (ex.: INTERMEDIARIO) ou identificador cru
        };
    }

    private static function parseString(string $s, int &$pos): string
    {
        self::expect($s, $pos, '"');
        $out = '';
        while (($s[$pos] ?? '"') !== '"') {
            if ($pos >= strlen($s)) {
                throw new ErroDeRequisicaoGeral('Query GraphQL inválida: string sem fechamento.');
            }
            if ($s[$pos] === '\\' && isset($s[$pos + 1])) {
                $out .= $s[$pos + 1];
                $pos += 2;
                continue;
            }
            $out .= $s[$pos];
            $pos++;
        }
        $pos++; // fecha "
        return $out;
    }

    private static function parseNumber(string $s, int &$pos): int|float
    {
        $m = [];
        if (!preg_match('/-?\d+(\.\d+)?/A', $s, $m, 0, $pos)) {
            throw new ErroDeRequisicaoGeral('Query GraphQL inválida: número esperado.');
        }
        $pos += strlen($m[0]);
        return isset($m[1]) && $m[1] !== '' ? (float) $m[0] : (int) $m[0];
    }

    private static function parseBareWord(string $s, int &$pos): ?string
    {
        $m = [];
        if (!preg_match('/[A-Za-z_][A-Za-z0-9_]*/A', $s, $m, 0, $pos)) {
            return null;
        }
        $pos += strlen($m[0]);
        return $m[0];
    }

    private static function skipWs(string $s, int &$pos): void
    {
        while (isset($s[$pos]) && ctype_space($s[$pos])) {
            $pos++;
        }
    }

    private static function expect(string $s, int &$pos, string $char): void
    {
        if (($s[$pos] ?? '') !== $char) {
            throw new ErroDeRequisicaoGeral("Query GraphQL inválida: esperava '{$char}'.");
        }
        $pos++;
    }

    /**
     * Projeta o Curso na forma da seleção pedida (aninhada). `null` = seleção
     * ausente — devolve tudo, o comportamento default que produz o
     * over-fetching medido pelo Wire log.
     *
     * @param array<string, mixed>|null $selection
     * @return array<string, mixed>
     */
    private static function project(Curso $curso, ?array $selection): array
    {
        $full = $curso->toArray();
        return $selection === null || $selection === [] ? $full : self::podar($full, $selection);
    }

    /**
     * @param array<string, mixed> $dados
     * @param array<string, mixed> $selecao
     * @return array<string, mixed>
     */
    private static function podar(array $dados, array $selecao): array
    {
        $saida = [];
        foreach ($selecao as $campo => $sub) {
            if (!array_key_exists($campo, $dados)) {
                continue;
            }
            $valor = $dados[$campo];

            if ($sub === null || !is_array($valor)) {
                $saida[$campo] = $valor;
                continue;
            }

            $saida[$campo] = array_is_list($valor)
                ? array_map(static fn (mixed $item) => is_array($item) ? self::podar($item, $sub) : $item, $valor)
                : self::podar($valor, $sub);
        }
        return $saida;
    }

    private static function ok(array $data): array
    {
        return ['status' => 200, 'body' => json_encode(['data' => $data], JSON_UNESCAPED_UNICODE), 'contentType' => 'application/json'];
    }

    private static function error(string $message, string $classification): array
    {
        $body = [
            'errors' => [[
                'message' => $message,
                'extensions' => ['classification' => $classification],
            ]],
            'data' => null,
        ];
        return ['status' => 200, 'body' => json_encode($body, JSON_UNESCAPED_UNICODE), 'contentType' => 'application/json'];
    }
}
