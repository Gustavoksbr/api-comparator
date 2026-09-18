<?php

namespace App\Persistencia;

/**
 * O driver efetivamente usado em produção por este projeto (veja
 * Http\Router::depositoPadrao()): permite ao array "sobreviver" entre
 * requisições mesmo sem worker mode, serializando em JSON num diretório
 * temporário do sistema operacional. Nunca é exposto pela rede, não é um
 * banco de dados e é apagado a cada reinício do host — o mesmo efeito
 * prático de um "banco em memória", só que sobrevivendo ao modelo
 * shared-nothing do `php -S`.
 *
 * Diferença deliberada em relação ao design mais defensivo de hashear a
 * chave no nome do arquivo: aqui a chave (o id do sandbox) já chega
 * sanitizada por Http\Router::sessaoDe() — só `[A-Za-z0-9_-]`, no máximo 64
 * caracteres — então usá-la direto no nome do arquivo não abre path
 * traversal, e evita um bug sutil: se chaves() devolvesse hashes em vez dos
 * ids originais, apagar() teria que saber disso para não hashear de novo (e
 * então apagar o arquivo errado) quando chamado a partir da varredura de TTL.
 */
final class DepositoEmArquivo implements Deposito
{
    public function __construct(private readonly string $diretorio)
    {
        if (!is_dir($this->diretorio)
            && !mkdir($this->diretorio, 0o777, true)
            && !is_dir($this->diretorio)
        ) {
            throw new \RuntimeException("Não foi possível criar {$this->diretorio}");
        }
    }

    public function ler(string $chave): ?array
    {
        $caminho = $this->caminho($chave);
        if (!is_file($caminho)) {
            return null;
        }

        $bruto = file_get_contents($caminho);
        if ($bruto === false || $bruto === '') {
            return null;
        }

        $valor = json_decode($bruto, true);
        if (!is_array($valor)) {
            // Arquivo corrompido por escrita concorrente: tratar como ausente
            // é seguro, porque todo estado aqui é descartável por construção.
            return null;
        }

        touch($caminho);

        return $valor;
    }

    public function escrever(string $chave, array $valor): void
    {
        file_put_contents(
            $this->caminho($chave),
            json_encode($valor, JSON_UNESCAPED_UNICODE),
            LOCK_EX,
        );
    }

    public function apagar(string $chave): void
    {
        $caminho = $this->caminho($chave);
        if (is_file($caminho)) {
            @unlink($caminho);
        }
    }

    public function chaves(): array
    {
        $chaves = [];
        foreach (glob($this->diretorio . '/*.json') ?: [] as $caminho) {
            $chaves[basename($caminho, '.json')] = filemtime($caminho) ?: 0;
        }

        return $chaves;
    }

    private function caminho(string $chave): string
    {
        $seguro = preg_replace('/[^A-Za-z0-9_-]/', '_', $chave) ?? 'anonimo';

        return $this->diretorio . '/' . $seguro . '.json';
    }
}
