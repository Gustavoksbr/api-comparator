import {Component, computed, input} from '@angular/core';
import {HighlightJsDirective} from 'ngx-highlight-js';
import {CursoSignalService} from '../../../services/curso-signal/curso-signal.service';
import {NgStyle} from '@angular/common';
import {ApiTipo} from '../../../models/Models';
@Component({
  selector: 'app-code-highlighter-response',
  standalone: true,
  imports: [
    HighlightJsDirective,
    NgStyle
  ],
  templateUrl: './code-highlighter-response.component.html',
  styleUrls: ['./code-highlighter-response.component.css','../code-content.css']
})
export class CodeHighlighterResponseComponent {
  constructor(public cursoSignalService : CursoSignalService) {
  }
  public linguagem = computed(() => {
    switch (this.apiType()) {
      case 'REST':
        return 'json';
      case 'GRAPHQL':
        return 'graphql';
      case 'SOAP':
        return 'xml';
      default:
        return 'json';
    }
  });
  public apiType = input<ApiTipo>('REST');
  public bodyResponse = computed(() => {
    const casoDeUso = this.casoDeUsoAtual();
    const tipoApi = this.apiType();
    return this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].bodyResponse();
  });
  public casoDeUsoAtual = computed(() => {
    return this.cursoSignalService.casoDeUsoSelecionado();
  });
  public statusCode = computed(() => {
    return this.cursoSignalService.respostasDaApi[this.casoDeUsoAtual()][this.apiType()].statusCode();
  });
  get formattedResponse(): string {
    const tipo = this.apiType();
    const raw = this.bodyResponse() || '';

    try {
      if (tipo === 'REST' || tipo === 'GRAPHQL') {
        return JSON.stringify(JSON.parse(raw), null,2);
        //  JSON.stringify(value, replacer, space)
        //   value = valor a ser convertido em uma string JSON.
        //   replacer = null — nenhum transformador ou filtro é aplicado; todos os campos são incluídos.
        //   space = 2 — define a indentação do JSON formatado em 2 espaços por nível (usa a string ou número passado para espaçamento).
      }

      if (tipo === 'SOAP') {
        return this.formatXml(raw);
      }

      return raw;
    } catch (e) {
      // se der erro (não é JSON válido, etc), retorna como veio
      return raw;
    }
  }

  private formatXml(xml: string): string {
    let formatted = '';
    const reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    let pad = 0;

    xml.split('\r\n').forEach((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad > 0) pad -= 1;
      } else if (node.match(/^<\w([^>]*[^/])?>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      const padding = new Array(pad + 1).join('  ');
      formatted += padding + node + '\r\n';
      pad += indent;
    });

    return formatted.trim();
  }


}
