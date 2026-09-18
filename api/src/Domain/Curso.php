<?php

namespace App\Domain;

/**
 * O domínio do projeto.
 *
 * Os tipos foram escolhidos para que cada campo caia num ponto onde REST,
 * GraphQL e SOAP divergem de verdade:
 *
 *   - `criadoEm`/`atualizadoEm` (data/hora): JSON não tem tipo de data, então
 *     vira string ISO 8601 e o cliente que se vire. O XSD tem `xs:dateTime`
 *     nativo; o GraphQL "sob medida" deste projeto trata como String mesmo
 *     (veja a nota em Controller\CursoGraphqlController).
 *   - `preco` (decimal): `number` em JSON é float binário; documentar isso é
 *     mais honesto que fingir que "Decimal" resolveria alguma coisa sem uma
 *     lib de bignum.
 *   - `nivel` (enum): de primeira classe no XSD e no SDL; em JSON é só uma
 *     string, e a validação sobra para a aplicação.
 *   - `ativo` (booleano): trivial em todo lugar.
 *   - `tags` (lista de escalares) e `modulos` (lista de objetos): é onde o
 *     over-fetching deixa de ser teórico.
 *   - `instrutor` (objeto aninhado): o caso que o GraphQL resolve de graça e
 *     o REST só resolve inventando sintaxe sem contrato (`?campos=`).
 */
class Curso
{
    public const FORMATO_DATA = \DateTimeInterface::ATOM;

    /**
     * @param string[] $tags
     * @param Modulo[] $modulos
     */
    public function __construct(
        public string $codigo,
        public string $titulo,
        public string $descricao,
        public ?int $cargaHoraria,
        public Nivel $nivel = Nivel::INICIANTE,
        public float $preco = 0.0,
        public bool $ativo = true,
        public ?\DateTimeImmutable $criadoEm = null,
        public ?\DateTimeImmutable $atualizadoEm = null,
        public array $tags = [],
        public ?Instrutor $instrutor = null,
        public array $modulos = [],
    ) {
        $this->criadoEm ??= new \DateTimeImmutable();
        $this->atualizadoEm ??= $this->criadoEm;
        $this->instrutor ??= new Instrutor('', '', '');
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'codigo' => $this->codigo,
            'titulo' => $this->titulo,
            'descricao' => $this->descricao,
            'cargaHoraria' => $this->cargaHoraria,
            'nivel' => $this->nivel->value,
            // Arredondado a 2 casas porque é dinheiro, mas continua sendo um
            // `number` de JSON por baixo — um float binário. Mostrar essa
            // limitação é parte do ponto didático, não um bug a esconder.
            'preco' => round($this->preco, 2),
            'ativo' => $this->ativo,
            'criadoEm' => $this->criadoEm->format(self::FORMATO_DATA),
            'atualizadoEm' => $this->atualizadoEm->format(self::FORMATO_DATA),
            'tags' => $this->tags,
            'instrutor' => $this->instrutor->toArray(),
            'modulos' => array_map(static fn (Modulo $m): array => $m->toArray(), $this->modulos),
        ];
    }

    /** @param array<string,mixed> $d */
    public static function fromArray(array $d): self
    {
        return new self(
            (string) ($d['codigo'] ?? ''),
            (string) ($d['titulo'] ?? ''),
            (string) ($d['descricao'] ?? ''),
            (int) ($d['cargaHoraria'] ?? 0),
            Nivel::tryFrom((string) ($d['nivel'] ?? '')) ?? Nivel::INICIANTE,
            (float) ($d['preco'] ?? 0),
            (bool) ($d['ativo'] ?? true),
            self::data($d['criadoEm'] ?? null),
            self::data($d['atualizadoEm'] ?? null),
            array_values(array_map('strval', (array) ($d['tags'] ?? []))),
            Instrutor::fromArray((array) ($d['instrutor'] ?? [])),
            array_values(array_map(
                static fn (array $m): Modulo => Modulo::fromArray($m),
                (array) ($d['modulos'] ?? []),
            )),
        );
    }

    private static function data(mixed $valor): \DateTimeImmutable
    {
        if (!is_string($valor) || $valor === '') {
            return new \DateTimeImmutable();
        }
        try {
            return new \DateTimeImmutable($valor);
        } catch (\Exception) {
            return new \DateTimeImmutable();
        }
    }

    /**
     * Projeta apenas os campos pedidos (usado pelo `?campos=` do REST),
     * aceitando caminhos aninhados: `codigo,instrutor.nome,modulos.titulo`
     * devolve o código, só o nome do instrutor e só o título de cada módulo.
     *
     * Sintaxe inventada por este projeto, sem nada no contrato REST que a
     * descreva — e é exatamente essa ausência de contrato que a seleção de
     * campos nativa do GraphQL resolve de graça.
     *
     * @param string[] $campos
     * @return array<string,mixed>
     */
    public function projetar(array $campos): array
    {
        return self::podar($this->toArray(), self::arvoreDeCampos($campos));
    }

    /**
     * @param string[] $campos
     * @return array<string,array<string,mixed>>
     */
    public static function arvoreDeCampos(array $campos): array
    {
        $arvore = [];
        foreach ($campos as $campo) {
            $partes = array_values(array_filter(explode('.', trim($campo)), static fn (string $p): bool => $p !== ''));
            if ($partes === []) {
                continue;
            }
            $no = &$arvore;
            foreach ($partes as $parte) {
                $no[$parte] ??= [];
                $no = &$no[$parte];
            }
            unset($no);
        }
        return $arvore;
    }

    /**
     * @param array<string,mixed> $dados
     * @param array<string,array<string,mixed>> $arvore
     * @return array<string,mixed>
     */
    private static function podar(array $dados, array $arvore): array
    {
        if ($arvore === []) {
            return $dados;
        }

        $saida = [];
        foreach ($arvore as $campo => $filhos) {
            if (!array_key_exists($campo, $dados)) {
                continue;
            }
            $valor = $dados[$campo];

            if ($filhos === [] || !is_array($valor)) {
                $saida[$campo] = $valor;
                continue;
            }

            $saida[$campo] = array_is_list($valor)
                ? array_map(
                    static fn (mixed $item): mixed => is_array($item) ? self::podar($item, $filhos) : $item,
                    $valor,
                )
                : self::podar($valor, $filhos);
        }

        return $saida;
    }
}
