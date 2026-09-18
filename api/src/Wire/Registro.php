<?php

namespace App\Wire;

/**
 * Uma requisição, medida. A unidade de dado do wire log.
 *
 * Os campos aqui respondem à pergunta central do comparador — "quanto custa,
 * de verdade, cada estilo de API?" — e quase nenhum deles é obtenível pelo
 * JavaScript do browser (a Resource Timing API dá `transferSize` e para aí, e
 * headers de resposta só os que o CORS expõe). Por isso o wire log vive no
 * servidor.
 */
class Registro
{
    public function __construct(
        public string $leg,
        public string $casoDeUso,
        public string $metodo,
        public string $caminho,
        public int $status,
        public int $bytesRequest,
        public int $bytesResponse,
        public int $bytesResponseComprimido,
        public float $duracaoMs,
        /** Campos que o cliente pediu, quando o leg permite pedir (REST com `?campos=`, GraphQL pela seleção). */
        public ?int $camposPedidos,
        /** Campos que vieram de fato. A diferença é o over-fetching. */
        public ?int $camposRecebidos,
        public int $em,
    ) {
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'leg' => $this->leg,
            'casoDeUso' => $this->casoDeUso,
            'metodo' => $this->metodo,
            'caminho' => $this->caminho,
            'status' => $this->status,
            'bytesRequest' => $this->bytesRequest,
            'bytesResponse' => $this->bytesResponse,
            'bytesResponseComprimido' => $this->bytesResponseComprimido,
            'duracaoMs' => $this->duracaoMs,
            'camposPedidos' => $this->camposPedidos,
            'camposRecebidos' => $this->camposRecebidos,
            'em' => $this->em,
        ];
    }

    /** @param array<string,mixed> $d */
    public static function fromArray(array $d): self
    {
        return new self(
            (string) ($d['leg'] ?? '?'),
            (string) ($d['casoDeUso'] ?? ''),
            (string) ($d['metodo'] ?? ''),
            (string) ($d['caminho'] ?? ''),
            (int) ($d['status'] ?? 0),
            (int) ($d['bytesRequest'] ?? 0),
            (int) ($d['bytesResponse'] ?? 0),
            (int) ($d['bytesResponseComprimido'] ?? 0),
            (float) ($d['duracaoMs'] ?? 0.0),
            isset($d['camposPedidos']) ? (int) $d['camposPedidos'] : null,
            isset($d['camposRecebidos']) ? (int) $d['camposRecebidos'] : null,
            (int) ($d['em'] ?? 0),
        );
    }

    /** Forma agrupada, como o painel do front consome. @return array<string,mixed> */
    public function paraPainel(): array
    {
        return [
            'leg' => $this->leg,
            'casoDeUso' => $this->casoDeUso,
            'metodo' => $this->metodo,
            'caminho' => $this->caminho,
            'status' => $this->status,
            'bytes' => [
                'request' => $this->bytesRequest,
                'response' => $this->bytesResponse,
                'responseComprimido' => $this->bytesResponseComprimido,
                'total' => $this->bytesRequest + $this->bytesResponse,
            ],
            'duracaoMs' => round($this->duracaoMs, 3),
            'fetching' => [
                'camposPedidos' => $this->camposPedidos,
                'camposRecebidos' => $this->camposRecebidos,
                'overFetching' => $this->camposPedidos === null || $this->camposRecebidos === null
                    ? null
                    : $this->camposRecebidos - $this->camposPedidos,
            ],
            'em' => $this->em,
        ];
    }
}
