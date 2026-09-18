<?php

namespace App\Wire;

use App\Persistencia\Deposito;

/**
 * A razão pela qual bytes e latência não podem ser só "o que o fetch do
 * browser reporta". Escopado por sandbox, como todo o resto do
 * armazenamento deste projeto — cada visitante vê só o próprio tráfego.
 *
 * Buffer circular: só os últimos MAX_POR_SANDBOX registros, porque o
 * interesse aqui é a comparação recente entre REST/GraphQL/SOAP, não um
 * histórico permanente (que também contradiria a proposta de não persistir
 * nada de propósito).
 *
 * Simplificação deliberada frente à versão de referência: não guarda headers
 * nem uma amostra do corpo de cada chamada — o corpo da chamada ATUAL já
 * aparece nos painéis de request/response do comparador; o que falta ali é
 * justamente o histórico de bytes/duração entre chamadas, que é o que este
 * log acrescenta.
 */
class WireLog
{
    public const MAX_POR_SANDBOX = 60;

    public function __construct(private readonly Deposito $deposito)
    {
    }

    public function registrar(string $sandboxId, Registro $registro): void
    {
        $linhas = $this->deposito->ler($sandboxId) ?? [];
        $linhas[] = $registro->toArray();

        $excesso = count($linhas) - self::MAX_POR_SANDBOX;
        if ($excesso > 0) {
            $linhas = array_slice($linhas, $excesso);
        }

        $this->deposito->escrever($sandboxId, array_values($linhas));
    }

    /** @return Registro[] */
    public function de(string $sandboxId): array
    {
        return array_map(
            static fn (array $l): Registro => Registro::fromArray($l),
            array_values($this->deposito->ler($sandboxId) ?? []),
        );
    }

    public function limpar(string $sandboxId): void
    {
        $this->deposito->apagar($sandboxId);
    }

    /**
     * Agrega por leg (REST/GraphQL/SOAP), a forma como o painel do front consome.
     *
     * @return array<string,array{chamadas:int,bytesTotal:int,bytesMedio:int,duracaoMediaMs:float}>
     */
    public function resumoPorLeg(string $sandboxId): array
    {
        $resumo = [];

        foreach ($this->de($sandboxId) as $r) {
            $leg = $resumo[$r->leg] ?? ['chamadas' => 0, 'bytesTotal' => 0, 'bytesMedio' => 0, 'duracaoMediaMs' => 0.0];
            $leg['chamadas']++;
            $leg['bytesTotal'] += $r->bytesRequest + $r->bytesResponse;
            $leg['duracaoMediaMs'] += $r->duracaoMs;
            $resumo[$r->leg] = $leg;
        }

        foreach ($resumo as $nome => $leg) {
            $resumo[$nome]['bytesMedio'] = intdiv($leg['bytesTotal'], max(1, $leg['chamadas']));
            $resumo[$nome]['duracaoMediaMs'] = round($leg['duracaoMediaMs'] / max(1, $leg['chamadas']), 3);
        }

        return $resumo;
    }
}
