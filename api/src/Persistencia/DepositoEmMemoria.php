<?php

namespace App\Persistencia;

/**
 * Caminho rápido: um array que vive no processo.
 *
 * Só é útil sob um runtime PHP com worker mode real (o processo sobrevive
 * entre requisições, ex.: FrankenPHP). Sob o `php -S` usado neste projeto,
 * cada requisição é uma execução nova do interpretador e isto não guardaria
 * nada — por isso o Router escolhe DepositoEmArquivo por padrão (veja
 * Http\Router::depositoPadrao()). Mantido aqui para documentar a estratégia
 * completa e para funcionar de imediato caso o deploy troque de runtime.
 */
final class DepositoEmMemoria implements Deposito
{
    /** @var array<string,array<string,array<mixed>>> espaco => chave => valor */
    private static array $dados = [];

    /** @var array<string,array<string,int>> */
    private static array $ultimoAcesso = [];

    public function __construct(private readonly string $espaco)
    {
    }

    public function ler(string $chave): ?array
    {
        if (!isset(self::$dados[$this->espaco][$chave])) {
            return null;
        }
        self::$ultimoAcesso[$this->espaco][$chave] = time();

        return self::$dados[$this->espaco][$chave];
    }

    public function escrever(string $chave, array $valor): void
    {
        self::$dados[$this->espaco][$chave] = $valor;
        self::$ultimoAcesso[$this->espaco][$chave] = time();
    }

    public function apagar(string $chave): void
    {
        unset(self::$dados[$this->espaco][$chave], self::$ultimoAcesso[$this->espaco][$chave]);
    }

    public function chaves(): array
    {
        return self::$ultimoAcesso[$this->espaco] ?? [];
    }
}
