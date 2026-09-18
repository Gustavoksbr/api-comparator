<?php

namespace App\Domain;

use App\Domain\Exceptions\ErroDeRequisicaoGeral;

/**
 * Enum de domínio — um dos melhores contrastes entre REST, GraphQL e SOAP.
 *
 * GraphQL e o XSD/SOAP têm enum de primeira classe: o cliente descobre os
 * valores possíveis lendo o schema, e mandar um valor fora da lista é erro do
 * próprio contrato. JSON não tem enum nenhum, então no leg REST isto é só uma
 * string e a validação sobra para a aplicação (veja CursoValidator).
 */
enum Nivel: string
{
    case INICIANTE = 'INICIANTE';
    case INTERMEDIARIO = 'INTERMEDIARIO';
    case AVANCADO = 'AVANCADO';

    /** @return string[] */
    public static function valores(): array
    {
        return array_map(static fn (self $n): string => $n->value, self::cases());
    }

    public static function de(string $valor): self
    {
        return self::tryFrom(strtoupper(trim($valor)))
            ?? throw new ErroDeRequisicaoGeral(
                "Campo 'nivel': deve ser um de " . implode(', ', self::valores()) . '.',
            );
    }
}
