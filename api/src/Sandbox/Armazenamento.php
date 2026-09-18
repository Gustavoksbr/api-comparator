<?php

namespace App\Sandbox;

use App\Domain\Curso;
use App\Persistencia\Deposito;

/**
 * Mapeia Curso de e para o Depósito.
 *
 * Classe concreta, não interface: a decisão de "memória ou arquivo" já foi
 * tomada um nível abaixo, em Persistencia\Deposito, e duplicá-la aqui só
 * espalharia a mesma escolha por dois lugares.
 */
class Armazenamento
{
    public function __construct(private readonly Deposito $deposito)
    {
    }

    /** @return Curso[]|null null quando o sandbox ainda não existe */
    public function carregar(string $sandboxId): ?array
    {
        $linhas = $this->deposito->ler($sandboxId);
        if ($linhas === null) {
            return null;
        }

        return array_map(
            static fn (array $c): Curso => Curso::fromArray($c),
            array_values($linhas),
        );
    }

    /** @param Curso[] $cursos */
    public function salvar(string $sandboxId, array $cursos): void
    {
        $this->deposito->escrever(
            $sandboxId,
            array_map(static fn (Curso $c): array => $c->toArray(), $cursos),
        );
    }

    public function remover(string $sandboxId): void
    {
        $this->deposito->apagar($sandboxId);
    }

    /** @return array<string,int> sandboxId => timestamp do último acesso */
    public function sandboxes(): array
    {
        return $this->deposito->chaves();
    }

    public function driver(): string
    {
        return (new \ReflectionClass($this->deposito))->getShortName();
    }
}
