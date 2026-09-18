<?php

namespace App\Sandbox;

use App\Repository\CursoRepository;

/**
 * Entrega a cada sandbox (um visitante) o seu próprio CRUD, e faz a faxina.
 *
 * É a peça que substitui o MongoDB da versão anterior. O problema que ela
 * resolve não é "onde guardar dados" — é que antes havia um banco único onde
 * qualquer visitante do site público escrevia (e podia apagar) os dados de
 * todo mundo. Agora cada sandbox é isolado por um id que o front gera e
 * guarda no seu navegador (header X-Session-Id), sem login e sem cookie.
 *
 * Nada aqui persiste de propósito. Se o host reiniciar, a próxima requisição
 * re-semeia. Estado descartável é feature, não limitação.
 */
class Sandboxes
{
    /** Um sandbox inativo por mais que isto é coletado. */
    public const TTL_SEGUNDOS = 30 * 60;

    /** Teto global de sandboxes vivos, para o host não crescer sem limite. */
    public const MAX_SANDBOXES = 500;

    public function __construct(private readonly Armazenamento $armazenamento)
    {
    }

    /** O repositório deste sandbox, semeado se for o primeiro acesso. */
    public function para(string $sandboxId): CursoRepository
    {
        $this->coletar();

        if ($this->armazenamento->carregar($sandboxId) === null) {
            $this->armazenamento->salvar($sandboxId, Seed::cursos());
        }

        return new CursoRepository($this->armazenamento, $sandboxId);
    }

    /** Volta o sandbox ao estado inicial. */
    public function resetar(string $sandboxId): CursoRepository
    {
        $this->armazenamento->salvar($sandboxId, Seed::cursos());

        return new CursoRepository($this->armazenamento, $sandboxId);
    }

    /**
     * Expira por TTL e, se ainda houver excesso, descarta os menos usados.
     *
     * Roda a cada requisição. É baratíssimo frente ao custo de uma varredura
     * agendada, que exigiria um scheduler que este projeto não quer ter.
     */
    private function coletar(): void
    {
        $sandboxes = $this->armazenamento->sandboxes();
        $limite = time() - self::TTL_SEGUNDOS;

        foreach ($sandboxes as $id => $ultimoAcesso) {
            if ($ultimoAcesso < $limite) {
                $this->armazenamento->remover($id);
                unset($sandboxes[$id]);
            }
        }

        $excesso = count($sandboxes) - self::MAX_SANDBOXES;
        if ($excesso <= 0) {
            return;
        }

        asort($sandboxes); // mais antigos primeiro
        foreach (array_slice(array_keys($sandboxes), 0, $excesso) as $id) {
            $this->armazenamento->remover($id);
        }
    }

    /** @return array{sandboxesVivos:int,ttlSegundos:int,maxSandboxes:int,driver:string} */
    public function diagnostico(): array
    {
        return [
            'sandboxesVivos' => count($this->armazenamento->sandboxes()),
            'ttlSegundos' => self::TTL_SEGUNDOS,
            'maxSandboxes' => self::MAX_SANDBOXES,
            'driver' => $this->armazenamento->driver(),
        ];
    }
}
