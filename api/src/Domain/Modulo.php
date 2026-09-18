<?php

namespace App\Domain;

/**
 * Lista de objetos aninhados dentro de Curso — o caso que mais separa os
 * estilos: listar todos os cursos arrasta todos os módulos de todos eles no
 * REST, mesmo quando a tela só mostra o título, enquanto o GraphQL deixa o
 * cliente nem pedir o campo.
 */
class Modulo
{
    public function __construct(
        public int $ordem,
        public string $titulo,
        public int $duracaoMinutos,
    ) {
    }

    /** @return array{ordem: int, titulo: string, duracaoMinutos: int} */
    public function toArray(): array
    {
        return ['ordem' => $this->ordem, 'titulo' => $this->titulo, 'duracaoMinutos' => $this->duracaoMinutos];
    }

    /** @param array<string,mixed> $d */
    public static function fromArray(array $d): self
    {
        return new self(
            (int) ($d['ordem'] ?? 0),
            (string) ($d['titulo'] ?? ''),
            (int) ($d['duracaoMinutos'] ?? 0),
        );
    }
}
