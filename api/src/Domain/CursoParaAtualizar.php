<?php

namespace App\Domain;

/**
 * Uma atualização parcial. `null` significa "não mexa neste campo", nunca
 * "apague este campo" — a distinção importa porque cada transporte expressa
 * ausência de um jeito (chave ausente no JSON, argumento não informado no
 * GraphQL, elemento omitido no XML) e todos precisam desembocar no MESMO
 * `null` para que a comparação entre os três legs seja honesta.
 */
class CursoParaAtualizar
{
    /**
     * @param string[]|null $tags
     * @param Modulo[]|null $modulos
     */
    public function __construct(
        public ?string $codigo,
        public ?string $codigoNovo,
        public ?string $titulo,
        public ?string $descricao,
        public ?int $cargaHoraria,
        public ?Nivel $nivel = null,
        public ?float $preco = null,
        public ?bool $ativo = null,
        public ?array $tags = null,
        public ?Instrutor $instrutor = null,
        public ?array $modulos = null,
    ) {
    }
}
