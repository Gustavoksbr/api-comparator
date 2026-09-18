<?php

namespace App\Domain;

use App\Domain\Exceptions\ErroDeRequisicaoGeral;

class CursoValidator
{
    private const CODIGO_PATTERN = '/^[A-Za-zÀ-ÿ0-9 ]+$/u';

    private const PRECO_MIN = 0.0;
    private const PRECO_MAX = 9999.99;
    private const TAGS_MAX = 8;
    private const TAG_MAX = 20;
    private const MODULOS_MAX = 20;
    private const INSTRUTOR_NOME_MAX = 60;
    private const INSTRUTOR_BIO_MAX = 160;
    private const MODULO_TITULO_MAX = 60;

    public function validarCriacao(Curso $dto): void
    {
        // ---- Código ----
        if ($this->isBlank($dto->codigo)) {
            throw new ErroDeRequisicaoGeral("Campo 'codigo': não deve estar em branco.");
        }
        if (mb_strlen($dto->codigo) > 15) {
            throw new ErroDeRequisicaoGeral("Campo 'codigo': deve ter no máximo 15 caracteres.");
        }
        if (!preg_match(self::CODIGO_PATTERN, $dto->codigo)) {
            throw new ErroDeRequisicaoGeral("Campo 'codigo': deve conter apenas letras e números.");
        }

        // ---- Título ----
        if ($this->isBlank($dto->titulo)) {
            throw new ErroDeRequisicaoGeral("Campo 'titulo': não deve estar em branco.");
        }
        if ($dto->titulo !== null && mb_strlen($dto->titulo) > 30) {
            throw new ErroDeRequisicaoGeral("Campo 'titulo': deve ter no máximo 30 caracteres.");
        }

        // ---- Descrição ----
        if ($this->isBlank($dto->descricao)) {
            throw new ErroDeRequisicaoGeral("Campo 'descricao': não deve estar em branco.");
        }
        if ($dto->descricao !== null && mb_strlen($dto->descricao) > 100) {
            throw new ErroDeRequisicaoGeral("Campo 'descricao': deve ter no máximo 100 caracteres.");
        }

        // ---- Carga Horária ----
        if ($dto->cargaHoraria === null) {
            throw new ErroDeRequisicaoGeral("Campo 'cargaHoraria': não deve ser nulo.");
        }
        if ($dto->cargaHoraria < 1 || $dto->cargaHoraria > 300) {
            throw new ErroDeRequisicaoGeral("Campo 'cargaHoraria': deve estar entre 1 e 300.");
        }

        // ---- Preço, tags, instrutor, módulos ----
        $this->validarPreco($dto->preco);
        $this->validarTags($dto->tags);
        $this->validarInstrutor($dto->instrutor);
        $this->validarModulos($dto->modulos);
    }

    public function validarAtualizacao(CursoParaAtualizar $dto): void
    {
        if ($this->isBlank($dto->codigo)) {
            throw new ErroDeRequisicaoGeral('Escolha o código do curso que deseja atualizar.');
        }

        if (!$this->isBlank($dto->codigoNovo)) {
            if (mb_strlen($dto->codigoNovo) > 15) {
                throw new ErroDeRequisicaoGeral("Campo 'codigoNovo': deve ter no máximo 15 caracteres.");
            }
            if (!preg_match(self::CODIGO_PATTERN, $dto->codigoNovo)) {
                throw new ErroDeRequisicaoGeral("Campo 'codigoNovo': deve conter apenas letras e números.");
            }
        }

        // ---- Título ----
        if ($dto->titulo !== null && mb_strlen($dto->titulo) > 30) {
            throw new ErroDeRequisicaoGeral("Campo 'titulo': deve ter no máximo 30 caracteres.");
        }

        // ---- Descrição ----
        if ($dto->descricao !== null && mb_strlen($dto->descricao) > 100) {
            throw new ErroDeRequisicaoGeral("Campo 'descricao': deve ter no máximo 100 caracteres.");
        }

        // ---- Carga Horária ----
        if ($dto->cargaHoraria !== null) {
            if ($dto->cargaHoraria < 1 || $dto->cargaHoraria > 300) {
                throw new ErroDeRequisicaoGeral("Campo 'cargaHoraria': deve estar entre 1 e 300.");
            }
        }

        // ---- Preço, tags, instrutor, módulos (só se informados: patch parcial) ----
        if ($dto->preco !== null) {
            $this->validarPreco($dto->preco);
        }
        if ($dto->tags !== null) {
            $this->validarTags($dto->tags);
        }
        if ($dto->instrutor !== null) {
            $this->validarInstrutor($dto->instrutor);
        }
        if ($dto->modulos !== null) {
            $this->validarModulos($dto->modulos);
        }
    }

    private function validarPreco(float $preco): void
    {
        if ($preco < self::PRECO_MIN || $preco > self::PRECO_MAX) {
            throw new ErroDeRequisicaoGeral(
                "Campo 'preco': deve estar entre " . self::PRECO_MIN . ' e ' . self::PRECO_MAX . '.',
            );
        }
        // Dinheiro com mais de duas casas quase sempre é erro do cliente — e
        // este campo existe no projeto justamente para mostrar que `number`
        // em JSON não é decimal exato.
        if (round($preco, 2) !== round($preco, 6)) {
            throw new ErroDeRequisicaoGeral("Campo 'preco': no máximo 2 casas decimais.");
        }
    }

    /** @param string[] $tags */
    private function validarTags(array $tags): void
    {
        if (count($tags) > self::TAGS_MAX) {
            throw new ErroDeRequisicaoGeral("Campo 'tags': no máximo " . self::TAGS_MAX . ' itens.');
        }
        foreach ($tags as $tag) {
            if (trim($tag) === '') {
                throw new ErroDeRequisicaoGeral("Campo 'tags': nenhuma tag pode estar em branco.");
            }
            if (mb_strlen($tag) > self::TAG_MAX) {
                throw new ErroDeRequisicaoGeral("Campo 'tags': cada tag deve ter no máximo " . self::TAG_MAX . ' caracteres.');
            }
        }
        if (count(array_unique($tags)) !== count($tags)) {
            throw new ErroDeRequisicaoGeral("Campo 'tags': não deve conter repetidas.");
        }
    }

    private function validarInstrutor(Instrutor $instrutor): void
    {
        if (trim($instrutor->nome) === '') {
            throw new ErroDeRequisicaoGeral("Campo 'instrutor.nome': não deve estar em branco.");
        }
        if (mb_strlen($instrutor->nome) > self::INSTRUTOR_NOME_MAX) {
            throw new ErroDeRequisicaoGeral("Campo 'instrutor.nome': deve ter no máximo " . self::INSTRUTOR_NOME_MAX . ' caracteres.');
        }
        if (filter_var($instrutor->email, FILTER_VALIDATE_EMAIL) === false) {
            throw new ErroDeRequisicaoGeral("Campo 'instrutor.email': e-mail inválido.");
        }
        if (mb_strlen($instrutor->bio) > self::INSTRUTOR_BIO_MAX) {
            throw new ErroDeRequisicaoGeral("Campo 'instrutor.bio': deve ter no máximo " . self::INSTRUTOR_BIO_MAX . ' caracteres.');
        }
    }

    /** @param Modulo[] $modulos */
    private function validarModulos(array $modulos): void
    {
        if (count($modulos) > self::MODULOS_MAX) {
            throw new ErroDeRequisicaoGeral("Campo 'modulos': no máximo " . self::MODULOS_MAX . ' itens.');
        }

        $ordens = [];
        foreach ($modulos as $modulo) {
            if (trim($modulo->titulo) === '') {
                throw new ErroDeRequisicaoGeral("Campo 'modulos.titulo': não deve estar em branco.");
            }
            if (mb_strlen($modulo->titulo) > self::MODULO_TITULO_MAX) {
                throw new ErroDeRequisicaoGeral("Campo 'modulos.titulo': deve ter no máximo " . self::MODULO_TITULO_MAX . ' caracteres.');
            }
            if ($modulo->ordem < 1) {
                throw new ErroDeRequisicaoGeral("Campo 'modulos.ordem': deve ser maior que zero.");
            }
            if ($modulo->duracaoMinutos < 1 || $modulo->duracaoMinutos > 600) {
                throw new ErroDeRequisicaoGeral("Campo 'modulos.duracaoMinutos': deve estar entre 1 e 600.");
            }
            $ordens[] = $modulo->ordem;
        }

        if (count(array_unique($ordens)) !== count($ordens)) {
            throw new ErroDeRequisicaoGeral("Campo 'modulos.ordem': não deve repetir.");
        }
    }

    private function isBlank(?string $s): bool
    {
        return $s === null || trim($s) === '';
    }
}
