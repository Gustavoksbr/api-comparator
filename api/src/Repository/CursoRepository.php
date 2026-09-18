<?php

namespace App\Repository;

use App\Domain\Curso;
use App\Domain\CursoParaAtualizar;
use App\Domain\Exceptions\CursoNaoEncontrado;
use App\Domain\Exceptions\Erro409;
use App\Domain\Exceptions\LimiteDoSandboxExcedido;
use App\Domain\Exceptions\NenhumCursoEncontrado;
use App\Sandbox\Armazenamento;

/**
 * O CRUD de um único sandbox (veja Sandbox\Sandboxes). Não fala com nenhum
 * banco de dados — delega a leitura/escrita ao Armazenamento, que por sua vez
 * delega a um Persistencia\Deposito (memória ou arquivo, dependendo do
 * runtime; veja Http\Router::depositoPadrao()).
 */
class CursoRepository
{
    /** Teto por sandbox. Impede que um visitante sozinho esgote o armazenamento do host. */
    public const MAX_CURSOS = 50;

    public function __construct(
        private readonly Armazenamento $armazenamento,
        private readonly string $sandboxId,
    ) {
    }

    /** @return Curso[] */
    public function findAll(): array
    {
        return $this->armazenamento->carregar($this->sandboxId) ?? [];
    }

    /** @return Curso[] */
    public function findByParametros(string $titulo, string $descricao, int $minCargaHoraria, int $maxCargaHoraria): array
    {
        $cursos = array_values(array_filter($this->findAll(), function (Curso $c) use ($titulo, $descricao, $minCargaHoraria, $maxCargaHoraria) {
            $tituloOk = mb_stripos((string) $c->titulo, $titulo) !== false;
            $descricaoOk = mb_stripos((string) $c->descricao, $descricao) !== false;
            $cargaOk = $c->cargaHoraria >= $minCargaHoraria && $c->cargaHoraria <= $maxCargaHoraria;
            return $tituloOk && $descricaoOk && $cargaOk;
        }));

        if (count($cursos) === 0) {
            throw new NenhumCursoEncontrado('Nenhum curso encontrado com os parâmetros fornecidos');
        }

        return $cursos;
    }

    public function findByCodigo(string $codigo): Curso
    {
        foreach ($this->findAll() as $c) {
            if ($c->codigo === $codigo) {
                return $c;
            }
        }
        throw new CursoNaoEncontrado('Curso não encontrado');
    }

    private function existe(string $codigo, array $cursos): bool
    {
        foreach ($cursos as $c) {
            if ($c->codigo === $codigo) {
                return true;
            }
        }
        return false;
    }

    public function create(Curso $curso): Curso
    {
        $cursos = $this->findAll();

        if ($this->existe($curso->codigo, $cursos)) {
            throw new Erro409('Curso com o mesmo código já existente');
        }
        if (count($cursos) >= self::MAX_CURSOS) {
            throw new LimiteDoSandboxExcedido(
                'Este sandbox atingiu o limite de ' . self::MAX_CURSOS . ' cursos.'
            );
        }

        $cursos[] = $curso;
        $this->armazenamento->salvar($this->sandboxId, $cursos);

        return $curso;
    }

    public function delete(string $codigo): void
    {
        $cursos = $this->findAll();
        $depois = array_values(array_filter($cursos, fn (Curso $c) => $c->codigo !== $codigo));

        if (count($depois) === count($cursos)) {
            throw new CursoNaoEncontrado('Curso não encontrado');
        }

        $this->armazenamento->salvar($this->sandboxId, $depois);
    }

    public function update(CursoParaAtualizar $cursoParaAtualizar): Curso
    {
        $cursos = $this->findAll();
        $novoCodigo = $this->isBlank($cursoParaAtualizar->codigoNovo) ? null : $cursoParaAtualizar->codigoNovo;

        if ($novoCodigo !== null && $novoCodigo !== $cursoParaAtualizar->codigo && $this->existe($novoCodigo, $cursos)) {
            throw new Erro409('Curso com o mesmo código já existente');
        }

        $atualizado = null;
        foreach ($cursos as $i => $c) {
            if ($c->codigo !== $cursoParaAtualizar->codigo) {
                continue;
            }

            $atualizado = new Curso(
                codigo: $novoCodigo ?? $c->codigo,
                titulo: $this->isBlank($cursoParaAtualizar->titulo) ? $c->titulo : $cursoParaAtualizar->titulo,
                descricao: $this->isBlank($cursoParaAtualizar->descricao) ? $c->descricao : $cursoParaAtualizar->descricao,
                cargaHoraria: $cursoParaAtualizar->cargaHoraria ?? $c->cargaHoraria,
                nivel: $cursoParaAtualizar->nivel ?? $c->nivel,
                preco: $cursoParaAtualizar->preco ?? $c->preco,
                ativo: $cursoParaAtualizar->ativo ?? $c->ativo,
                // criadoEm nunca muda; atualizadoEm é sempre recalculado no
                // servidor e nunca aceito do cliente (campo derivado).
                criadoEm: $c->criadoEm,
                atualizadoEm: new \DateTimeImmutable(),
                tags: $cursoParaAtualizar->tags ?? $c->tags,
                instrutor: $cursoParaAtualizar->instrutor ?? $c->instrutor,
                modulos: $cursoParaAtualizar->modulos ?? $c->modulos,
            );
            $cursos[$i] = $atualizado;
            break;
        }

        if ($atualizado === null) {
            throw new CursoNaoEncontrado('Curso não encontrado');
        }

        $this->armazenamento->salvar($this->sandboxId, $cursos);

        return $atualizado;
    }

    private function isBlank(?string $s): bool
    {
        return $s === null || trim($s) === '';
    }
}
