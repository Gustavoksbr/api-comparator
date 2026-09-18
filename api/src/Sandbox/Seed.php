<?php

namespace App\Sandbox;

use App\Domain\Curso;
use App\Domain\Instrutor;
use App\Domain\Modulo;
use App\Domain\Nivel;

/**
 * Os dados com que todo sandbox nasce.
 *
 * Mesmos códigos c1..c10 de sempre. Diferente da versão anterior (que os
 * marcava como somente leitura porque o MongoDB era compartilhado entre
 * todos os visitantes), aqui eles podem ser editados e deletados livremente
 * — o sandbox é seu e é descartável (veja Sandbox\Sandboxes).
 *
 * As datas são FIXAS de propósito: um seed com `new DateTimeImmutable()`
 * faria cada sandbox nascer diferente, e num projeto que compara payloads
 * byte a byte isso destruiria a possibilidade de comparar duas execuções.
 *
 * A variedade também é deliberada: níveis diferentes, preços com e sem
 * centavos, cursos inativos, listas de módulos de tamanhos diferentes e um
 * curso sem módulo nenhum. Um payload uniforme escondería justamente as
 * diferenças que este projeto existe para mostrar.
 */
class Seed
{
    /** @return Curso[] */
    public static function cursos(): array
    {
        return [
            self::curso(
                'c1', 'REST na prática', 'Recursos, verbos, status codes e cache HTTP',
                40, Nivel::INICIANTE, 149.90, true, '2024-01-15T09:00:00+00:00',
                ['http', 'rest', 'cache'],
                new Instrutor('Ana Ribeiro', 'ana@exemplo.dev', 'Trabalha com APIs públicas há dez anos.'),
                [['Recursos e verbos', 90], ['Status codes que importam', 60], ['ETag e cache', 75]],
            ),
            self::curso(
                'c2', 'GraphQL do zero', 'Schema, resolvers, e o problema N+1',
                32, Nivel::INTERMEDIARIO, 199.00, true, '2024-03-02T14:30:00+00:00',
                ['graphql', 'schema', 'n+1'],
                new Instrutor('Bruno Lima', 'bruno@exemplo.dev', 'Migrou três monolitos para GraphQL e se arrependeu de um.'),
                [['SDL e tipos', 80], ['Resolvers', 95], ['DataLoader e N+1', 120]],
            ),
            self::curso(
                'c3', 'SOAP e WSDL', 'Envelope, Fault e contratos em XML Schema',
                24, Nivel::AVANCADO, 99.50, false, '2023-08-21T11:15:00+00:00',
                ['soap', 'xml', 'wsdl', 'legado'],
                new Instrutor('Clara Souza', 'clara@exemplo.dev', 'Mantém integrações bancárias que ninguém mais quer tocar.'),
                [['Envelope e Body', 60], ['WSDL na marra', 110]],
            ),
            self::curso(
                'c4', 'Contratos e Validação', 'Enums, decimais e datas em cada estilo de API',
                48, Nivel::AVANCADO, 249.90, true, '2024-05-10T08:45:00+00:00',
                ['contratos', 'validacao', 'tipos'],
                new Instrutor('Diego Alves', 'diego@exemplo.dev', 'Gosta de discutir se número é decimal.'),
                [['Enum: quatro graus de garantia', 90], ['Decimal em JSON não existe', 60], ['Data/hora em cada contrato', 70]],
            ),
            self::curso(
                'c5', 'Modelagem de APIs', 'Objetos aninhados, listas e o custo do over-fetching',
                16, Nivel::INTERMEDIARIO, 79.90, true, '2024-06-18T16:00:00+00:00',
                ['modelagem', 'over-fetching'],
                new Instrutor('Elisa Nunes', 'elisa@exemplo.dev', 'Já pediu instrutor.nome sem querer trazer o instrutor inteiro.'),
                [['Objetos aninhados', 45], ['Listas de objetos', 70]],
            ),
            self::curso(
                'c6', 'Erros e Status Codes', 'Semântica de erro: 404, soap:Fault e 200 + errors[]',
                8, Nivel::INICIANTE, 0.0, true, '2024-07-01T10:20:00+00:00',
                ['erros', 'http', 'semantica'],
                new Instrutor('Elisa Nunes', 'elisa@exemplo.dev', 'Já pediu instrutor.nome sem querer trazer o instrutor inteiro.'),
                [['Um mesmo erro, três formatos', 50]],
            ),
            self::curso(
                'c7', 'Filas e mensageria', 'AMQP, Kafka e entrega assíncrona',
                60, Nivel::AVANCADO, 329.90, true, '2023-11-30T13:05:00+00:00',
                ['amqp', 'kafka', 'assincrono', 'entrega'],
                new Instrutor('Fábio Moraes', 'fabio@exemplo.dev', 'Já perdeu mensagens o suficiente para levar idempotência a sério.'),
                [['Filas vs. logs', 85], ['Entrega ao menos uma vez', 100], ['Idempotência', 95], ['Dead letter', 60]],
            ),
            self::curso(
                'c8', 'APIs com Node.js', 'Crie e consuma APIs RESTful utilizando Node.js e Express',
                100, Nivel::INICIANTE, 49.90, false, '2023-05-09T07:40:00+00:00',
                ['nodejs', 'express', 'rest'],
                new Instrutor('Gabriela Pinto', 'gabriela@exemplo.dev', 'Depura API lendo o log de acesso.'),
                [['EHLO até QUIT', 65]],
            ),
            self::curso(
                'c9', 'Git e GitHub', 'Controle de versão colaborativo com Git e hospedagem no GitHub',
                40, Nivel::INTERMEDIARIO, 279.00, true, '2024-02-14T15:55:00+00:00',
                ['git', 'github', 'versionamento'],
                new Instrutor('Ana Ribeiro', 'ana@exemplo.dev', 'Trabalha com APIs públicas há dez anos.'),
                [['Branches e merges', 100], ['Pull requests', 90], ['Resolvendo conflitos', 80]],
            ),
            // Sem módulos de propósito: lista vazia é um caso que costuma
            // quebrar cliente, e o comparador precisa mostrá-lo.
            self::curso(
                'c10', 'Performance de rede', 'Latência, throughput e o custo do payload',
                200, Nivel::AVANCADO, 499.99, true, '2024-09-05T18:10:00+00:00',
                ['performance', 'latencia', 'payload'],
                new Instrutor('Diego Alves', 'diego@exemplo.dev', 'Gosta de discutir se número é decimal.'),
                [],
            ),
        ];
    }

    /**
     * @param string[] $tags
     * @param array{0:string,1:int}[] $modulos título e duração, na ordem
     */
    private static function curso(
        string $codigo,
        string $titulo,
        string $descricao,
        int $cargaHoraria,
        Nivel $nivel,
        float $preco,
        bool $ativo,
        string $criadoEm,
        array $tags,
        Instrutor $instrutor,
        array $modulos,
    ): Curso {
        $data = new \DateTimeImmutable($criadoEm);

        return new Curso(
            codigo: $codigo,
            titulo: $titulo,
            descricao: $descricao,
            cargaHoraria: $cargaHoraria,
            nivel: $nivel,
            preco: $preco,
            ativo: $ativo,
            criadoEm: $data,
            atualizadoEm: $data,
            tags: $tags,
            instrutor: $instrutor,
            modulos: array_values(array_map(
                static fn (int $i): Modulo => new Modulo($i + 1, $modulos[$i][0], $modulos[$i][1]),
                array_keys($modulos),
            )),
        );
    }
}
