<?php

namespace App\Persistencia;

/**
 * Onde mora o estado que precisa sobreviver entre requisições.
 *
 * Existe como interface porque o modelo de execução do PHP decide o que é
 * possível: sob um runtime com worker mode (o processo sobrevive entre
 * requisições) um array em memória basta; sob o servidor embutido do PHP
 * (`php -S`, usado no Dockerfile deste projeto) cada requisição roda numa
 * execução isolada do interpretador, e um array estático não sobrevive a
 * nada — daí o driver em arquivo ser o efetivamente usado em produção aqui.
 *
 * Trabalha com arrays JSON-serializáveis de propósito: quem chama faz o
 * mapeamento para os tipos do domínio (veja Sandbox\Armazenamento).
 */
interface Deposito
{
    /** @return array<mixed>|null null quando a chave não existe */
    public function ler(string $chave): ?array;

    /** @param array<mixed> $valor */
    public function escrever(string $chave, array $valor): void;

    public function apagar(string $chave): void;

    /**
     * Chaves vivas e o instante do último acesso, para TTL e LRU.
     *
     * @return array<string,int> chave => timestamp unix
     */
    public function chaves(): array;
}
