<?php

namespace App\Domain;

use App\Repository\CursoRepository;

class CursoService
{
    public function __construct(
        private CursoRepository $cursoRepository,
        private CursoValidator $cursoValidator,
    ) {
    }

    /** @return Curso[] */
    public function findAll(): array
    {
        return $this->cursoRepository->findAll();
    }

    /** @return Curso[] */
    public function findByParametros(?string $titulo, ?string $descricao, ?int $minCargaHoraria, ?int $maxCargaHoraria): array
    {
        return $this->cursoRepository->findByParametros(
            $titulo ?? '',
            $descricao ?? '',
            $minCargaHoraria ?? 0,
            $maxCargaHoraria ?? PHP_INT_MAX,
        );
    }

    public function findByCodigo(string $codigo): Curso
    {
        return $this->cursoRepository->findByCodigo($codigo);
    }

    public function create(Curso $curso): Curso
    {
        $this->cursoValidator->validarCriacao($curso);
        return $this->cursoRepository->create($curso);
    }

    public function update(CursoParaAtualizar $curso): Curso
    {
        $this->cursoValidator->validarAtualizacao($curso);
        return $this->cursoRepository->update($curso);
    }

    public function delete(string $codigo): void
    {
        $this->cursoRepository->delete($codigo);
    }
}
