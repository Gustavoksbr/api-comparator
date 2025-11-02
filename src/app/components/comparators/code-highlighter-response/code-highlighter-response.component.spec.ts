import { TestBed } from '@angular/core/testing';
import { CodeHighlighterResponseComponent } from './code-highlighter-response.component';
import { signal } from '@angular/core';
import { ApiTipo } from '../../../models/Models';

describe('CodeHighlighterResponseComponent', () => {
  let component: CodeHighlighterResponseComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CodeHighlighterResponseComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(CodeHighlighterResponseComponent);
    component = fixture.componentInstance;
  });

  it('deve formatar corretamente JSON REST (procurar por código c8)', () => {
    Object.defineProperty(component, 'apiType', {
      value: signal<ApiTipo>('REST'),
    });

    const rawJson = '{"codigo":"c8","titulo":"APIs com Node.js","descricao":"Crie e consuma APIs RESTful utilizando Node.js e Express","cargaHoraria":100}';
    Object.defineProperty(component, 'bodyResponse', {
      value: signal(rawJson),
    });

    const formatted = component.formattedResponse;

    console.log("Não formatado:", component.bodyResponse());
    console.log("Formatado:", formatted);

    expect(formatted).toBe(`{
  "codigo": "c8",
  "titulo": "APIs com Node.js",
  "descricao": "Crie e consuma APIs RESTful utilizando Node.js e Express",
  "cargaHoraria": 100
}`);
    expect(formatted).not.toBe(rawJson); // garante que mudou
    expect(formatted).not.toBe(component.bodyResponse()); // garante que mudou
  });

  it('deve formatar corretamente JSON GraphQL (procurar por código c8)', () => {
    Object.defineProperty(component, 'apiType', {
      value: signal<ApiTipo>('GRAPHQL'),
    });

    const rawJson = '{"data":{"getCursoByCodigo":{"codigo":"c8","titulo":"APIs com Node.js","descricao":"Crie e consuma APIs RESTful utilizando Node.js e Express","cargaHoraria":100}}}';
    Object.defineProperty(component, 'bodyResponse', {
      value: signal(rawJson),
    });

    const formatted = component.formattedResponse;

    console.log("Não formatado:", component.bodyResponse());
    console.log("Formatado:", formatted);

    expect(formatted).toBe(`{
  "data": {
    "getCursoByCodigo": {
      "codigo": "c8",
      "titulo": "APIs com Node.js",
      "descricao": "Crie e consuma APIs RESTful utilizando Node.js e Express",
      "cargaHoraria": 100
    }
  }
}`);
    expect(formatted).not.toBe(rawJson); // garante que mudou
    expect(formatted).not.toBe(component.bodyResponse()); // garante que mudou
  });

  it('deve identar corretamente XML SOAP (procurar por código c8)', () => {
    Object.defineProperty(component, 'apiType', {
      value: signal<ApiTipo>('SOAP'),
    });

    const rawXml = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Header/><SOAP-ENV:Body><ns3:CursoResponse xmlns:ns3="https://cursos-api-7vr6.onrender.com"><codigo>c8</codigo><titulo>APIs com Node.js</titulo><descricao>Crie e consuma APIs RESTful utilizando Node.js e Express</descricao><cargaHoraria>100</cargaHoraria></ns3:CursoResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>';
    Object.defineProperty(component, 'bodyResponse', {
      value: signal(rawXml),
    });

    const formatted = component.formattedResponse;

    console.log("Não formatado:", component.bodyResponse());
    console.log("Formatado:", formatted);

    expect(formatted).toContain('<SOAP-ENV:Envelope');
    expect(formatted).toContain('\r\n  <SOAP-ENV:Header/>');
    expect(formatted).toContain('<codigo>c8</codigo>');
    expect(formatted).toContain('</SOAP-ENV:Envelope>');
    expect(formatted).not.toBe(rawXml); // garante que mudou
    expect(formatted).not.toBe(component.bodyResponse()); // garante que mudou
  });
});
