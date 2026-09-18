<?php

namespace App\Controller;

use App\Domain\Curso;
use App\Domain\CursoParaAtualizar;
use App\Domain\CursoService;
use App\Domain\Instrutor;
use App\Domain\Modulo;
use App\Domain\Nivel;

/**
 * Equivalente ao CursoSoapController do backend Java. Em vez de depender de um
 * motor SOAP completo (WSDL dinâmico, JAXB, etc.), faz o parsing manual do
 * envelope SOAP recebido e monta a resposta XML no mesmo formato descrito em
 * cursos.xsd — incluindo os elementos repetidos (`tags`, `modulos`) e o
 * elemento aninhado (`instrutor`). Como no backend original, qualquer erro de
 * negócio é sempre devolvido como um SOAP Fault com status HTTP 500.
 */
class CursoSoapController
{
    public const NAMESPACE_URI = 'https://cursos-api-comparator/soap';

    public function __construct(private CursoService $cursoService)
    {
    }

    public function handle(string $rawBody): array
    {
        try {
            $requestEl = $this->extractRequestElement($rawBody);
            $localName = $requestEl !== null ? $requestEl->localName : null;

            $xml = match ($localName) {
                'listCursosRequest' => $this->listCursos(),
                'getCursoRequest' => $this->getCurso($requestEl),
                'procurarCursosRequest' => $this->procurarCursos($requestEl),
                'createCursoRequest' => $this->createCurso($requestEl),
                'updateCursoRequest' => $this->updateCurso($requestEl),
                'deleteCursoRequest' => $this->deleteCurso($requestEl),
                default => throw new \RuntimeException('Requisição SOAP não reconhecida.'),
            };

            return ['status' => 200, 'body' => $xml, 'contentType' => 'text/xml; charset=utf-8'];
        } catch (\Throwable $e) {
            return ['status' => 500, 'body' => $this->fault($e->getMessage()), 'contentType' => 'text/xml; charset=utf-8'];
        }
    }

    private function listCursos(): string
    {
        $cursos = $this->cursoService->findAll();
        return $this->envelope($this->listCursosResponseXml($cursos));
    }

    private function procurarCursos(?\DOMElement $req): string
    {
        $cursos = $this->cursoService->findByParametros(
            $this->text($req, 'titulo'),
            $this->text($req, 'descricao'),
            $this->intOrNull($this->text($req, 'minCargaHoraria')),
            $this->intOrNull($this->text($req, 'maxCargaHoraria')),
        );
        return $this->envelope($this->listCursosResponseXml($cursos));
    }

    private function getCurso(?\DOMElement $req): string
    {
        $curso = $this->cursoService->findByCodigo((string) $this->text($req, 'codigo'));
        return $this->envelope($this->cursoResponseXml($curso));
    }

    private function createCurso(?\DOMElement $req): string
    {
        $curso = new Curso(
            codigo: (string) ($this->text($req, 'codigo') ?? ''),
            titulo: (string) ($this->text($req, 'titulo') ?? ''),
            descricao: (string) ($this->text($req, 'descricao') ?? ''),
            cargaHoraria: $this->intOrNull($this->text($req, 'cargaHoraria')),
            nivel: Nivel::de((string) ($this->text($req, 'nivel') ?? Nivel::INICIANTE->value)),
            preco: (float) ($this->text($req, 'preco') ?? 0),
            ativo: $this->boolOr($this->text($req, 'ativo'), true),
            tags: $this->texts($req, 'tags'),
            instrutor: $this->instrutorDeXml($this->child($req, 'instrutor')),
            modulos: $this->modulosDeXml($this->children($req, 'modulos')),
        );
        $criado = $this->cursoService->create($curso);
        return $this->envelope($this->cursoResponseXml($criado));
    }

    private function updateCurso(?\DOMElement $req): string
    {
        $tagsEls = $this->children($req, 'tags');
        $modulosEls = $this->children($req, 'modulos');
        $instrutorEl = $this->child($req, 'instrutor');
        $nivelTxt = $this->text($req, 'nivel');
        $precoTxt = $this->text($req, 'preco');
        $ativoTxt = $this->text($req, 'ativo');

        $cursoParaAtualizar = new CursoParaAtualizar(
            codigo: $this->text($req, 'codigo'),
            codigoNovo: $this->text($req, 'codigoNovo'),
            titulo: $this->text($req, 'titulo'),
            descricao: $this->text($req, 'descricao'),
            cargaHoraria: $this->intOrNull($this->text($req, 'cargaHoraria')),
            nivel: $this->isBlank($nivelTxt) ? null : Nivel::de($nivelTxt),
            preco: $this->isBlank($precoTxt) ? null : (float) $precoTxt,
            ativo: $this->isBlank($ativoTxt) ? null : $this->boolOr($ativoTxt, true),
            tags: $tagsEls === [] ? null : array_map(static fn (\DOMElement $el): string => $el->textContent, $tagsEls),
            instrutor: $instrutorEl === null ? null : $this->instrutorDeXml($instrutorEl),
            modulos: $modulosEls === [] ? null : $this->modulosDeXml($modulosEls),
        );
        $atualizado = $this->cursoService->update($cursoParaAtualizar);
        return $this->envelope($this->cursoResponseXml($atualizado));
    }

    private function deleteCurso(?\DOMElement $req): string
    {
        $this->cursoService->delete((string) $this->text($req, 'codigo'));
        return $this->envelope('<deleteCursoResponse xmlns="' . self::NAMESPACE_URI . '"><success>true</success></deleteCursoResponse>');
    }

    // ---- montagem de XML ----

    private function envelope(string $bodyXml): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            . '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">'
            . '<SOAP-ENV:Header/>'
            . '<SOAP-ENV:Body>' . $bodyXml . '</SOAP-ENV:Body>'
            . '</SOAP-ENV:Envelope>';
    }

    private function fault(string $message): string
    {
        return $this->envelope(
            '<SOAP-ENV:Fault><faultcode>SOAP-ENV:Server</faultcode><faultstring>'
            . htmlspecialchars($message, ENT_XML1 | ENT_QUOTES, 'UTF-8')
            . '</faultstring></SOAP-ENV:Fault>'
        );
    }

    /** @param Curso[] $cursos */
    private function listCursosResponseXml(array $cursos): string
    {
        $items = '';
        foreach ($cursos as $curso) {
            $items .= $this->cursoFieldsXml($curso, 'cursos');
        }
        return '<ns3:listCursosResponse xmlns:ns3="' . self::NAMESPACE_URI . '">' . $items . '</ns3:listCursosResponse>';
    }

    private function cursoResponseXml(Curso $curso): string
    {
        return '<ns3:CursoResponse xmlns:ns3="' . self::NAMESPACE_URI . '">' . $this->cursoFieldsInner($curso) . '</ns3:CursoResponse>';
    }

    private function cursoFieldsXml(Curso $curso, string $tag): string
    {
        return "<{$tag}>" . $this->cursoFieldsInner($curso) . "</{$tag}>";
    }

    private function cursoFieldsInner(Curso $curso): string
    {
        $esc = fn (?string $v): string => htmlspecialchars((string) $v, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        $tags = '';
        foreach ($curso->tags as $tag) {
            $tags .= '<tags>' . $esc($tag) . '</tags>';
        }

        $modulos = '';
        foreach ($curso->modulos as $modulo) {
            $modulos .= '<modulos>'
                . '<ordem>' . $modulo->ordem . '</ordem>'
                . '<titulo>' . $esc($modulo->titulo) . '</titulo>'
                . '<duracaoMinutos>' . $modulo->duracaoMinutos . '</duracaoMinutos>'
                . '</modulos>';
        }

        $instrutor = $curso->instrutor;

        return '<codigo>' . $esc($curso->codigo) . '</codigo>'
            . '<titulo>' . $esc($curso->titulo) . '</titulo>'
            . '<descricao>' . $esc($curso->descricao) . '</descricao>'
            . '<cargaHoraria>' . (int) $curso->cargaHoraria . '</cargaHoraria>'
            . '<nivel>' . $curso->nivel->value . '</nivel>'
            . '<preco>' . round($curso->preco, 2) . '</preco>'
            . '<ativo>' . ($curso->ativo ? 'true' : 'false') . '</ativo>'
            . '<criadoEm>' . $esc($curso->criadoEm->format(Curso::FORMATO_DATA)) . '</criadoEm>'
            . '<atualizadoEm>' . $esc($curso->atualizadoEm->format(Curso::FORMATO_DATA)) . '</atualizadoEm>'
            . $tags
            . '<instrutor>'
            . '<nome>' . $esc($instrutor->nome) . '</nome>'
            . '<email>' . $esc($instrutor->email) . '</email>'
            . '<bio>' . $esc($instrutor->bio) . '</bio>'
            . '</instrutor>'
            . $modulos;
    }

    // ---- parsing do envelope recebido ----

    private function extractRequestElement(string $rawBody): ?\DOMElement
    {
        $dom = new \DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $ok = $dom->loadXML($rawBody);
        libxml_use_internal_errors($previous);
        if (!$ok) {
            throw new \RuntimeException('Envelope SOAP inválido.');
        }

        $bodies = $dom->getElementsByTagNameNS('http://schemas.xmlsoap.org/soap/envelope/', 'Body');
        if ($bodies->length === 0) {
            throw new \RuntimeException('Envelope SOAP sem <soap:Body>.');
        }
        $body = $bodies->item(0);
        foreach ($body->childNodes as $child) {
            if ($child->nodeType === XML_ELEMENT_NODE) {
                return $child;
            }
        }
        return null;
    }

    private function text(?\DOMElement $req, string $localName): ?string
    {
        $el = $this->child($req, $localName);
        return $el?->textContent;
    }

    private function child(?\DOMElement $req, string $localName): ?\DOMElement
    {
        if ($req === null) {
            return null;
        }
        foreach ($req->childNodes as $c) {
            if ($c->nodeType === XML_ELEMENT_NODE && $c->localName === $localName) {
                return $c;
            }
        }
        return null;
    }

    /** @return \DOMElement[] */
    private function children(?\DOMElement $req, string $localName): array
    {
        if ($req === null) {
            return [];
        }
        $out = [];
        foreach ($req->childNodes as $c) {
            if ($c->nodeType === XML_ELEMENT_NODE && $c->localName === $localName) {
                $out[] = $c;
            }
        }
        return $out;
    }

    /** @return string[] */
    private function texts(?\DOMElement $req, string $localName): array
    {
        return array_map(static fn (\DOMElement $el): string => $el->textContent, $this->children($req, $localName));
    }

    private function instrutorDeXml(?\DOMElement $el): Instrutor
    {
        return new Instrutor(
            (string) ($this->text($el, 'nome') ?? ''),
            (string) ($this->text($el, 'email') ?? ''),
            (string) ($this->text($el, 'bio') ?? ''),
        );
    }

    /**
     * @param \DOMElement[] $els
     * @return Modulo[]
     */
    private function modulosDeXml(array $els): array
    {
        return array_values(array_map(
            function (\DOMElement $el, int $i): Modulo {
                $ordemTxt = $this->text($el, 'ordem');
                return new Modulo(
                    $this->isBlank($ordemTxt) ? $i + 1 : (int) $ordemTxt,
                    (string) ($this->text($el, 'titulo') ?? ''),
                    (int) ($this->text($el, 'duracaoMinutos') ?? 0),
                );
            },
            $els,
            array_keys($els),
        ));
    }

    private function boolOr(?string $value, bool $default): bool
    {
        if ($this->isBlank($value)) {
            return $default;
        }
        return in_array(strtolower(trim($value)), ['true', '1'], true);
    }

    private function intOrNull(?string $value): ?int
    {
        return $this->isBlank($value) ? null : (int) $value;
    }

    private function isBlank(?string $value): bool
    {
        return $value === null || trim($value) === '';
    }
}
