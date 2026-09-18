<?php

namespace App\Domain;

/**
 * Objeto aninhado dentro de Curso.
 *
 * Existe para exercitar o que um CRUD raso não consegue mostrar: no REST,
 * pedir só o nome do instrutor obriga a trazer o objeto inteiro (ou a
 * inventar um `?campos=instrutor.nome` sem contrato de verdade). No GraphQL,
 * selecionar subcampos é a operação natural — a diferença aparece em bytes
 * no request/response mostrado pelo comparador.
 */
class Instrutor
{
    public function __construct(
        public string $nome,
        public string $email,
        public string $bio,
    ) {
    }

    /** @return array{nome: string, email: string, bio: string} */
    public function toArray(): array
    {
        return ['nome' => $this->nome, 'email' => $this->email, 'bio' => $this->bio];
    }

    /** @param array<string,mixed> $d */
    public static function fromArray(array $d): self
    {
        return new self(
            (string) ($d['nome'] ?? ''),
            (string) ($d['email'] ?? ''),
            (string) ($d['bio'] ?? ''),
        );
    }
}
