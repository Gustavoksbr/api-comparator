import {Component, computed, input} from '@angular/core';
import {HighlightJsDirective} from 'ngx-highlight-js';
import {CursoSignalService} from '../../../services/curso-signal.service';
import {NgStyle} from '@angular/common';
type apiTipos = 'REST' | 'SOAP' | 'GRAPHQL' ;
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
  constructor(protected cursoSignalService : CursoSignalService) {
  }
  public linguagem = computed(() => {
    switch (this.apiTipo()) {
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
  public apiTipo = input<apiTipos>('REST');
  public bodyResponse = computed(() => {
    const casoDeUso = this.cursoSignalService.casoDeUsoSelecionado();
    const tipoApi = this.apiTipo();
    return this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].bodyResponse();
  });

  get formattedResponse(): string {
    const tipo = this.apiTipo();
    const raw = this.bodyResponse() || '';

    try {
      if (tipo === 'REST' || tipo === 'GRAPHQL') {
        return JSON.stringify(JSON.parse(raw), null, 2);
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
    // remove espaços extras
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
  public casoDeUsoAtual = computed(() => {
    return this.cursoSignalService.casoDeUsoSelecionado();
  });
  public statusCode = computed(() => {
    return this.cursoSignalService.respostasDaApi[this.casoDeUsoAtual()][this.apiTipo()].statusCode();
  });
}
