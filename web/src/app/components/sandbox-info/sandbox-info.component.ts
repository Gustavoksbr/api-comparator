import { Component, computed } from '@angular/core';
import { SessaoService } from '../../services/sessao/sessao.service';
import { PostmanExportService } from '../../services/postman-export/postman-export.service';

/**
 * Mostra qual sandbox de cursos este navegador está usando, explica o que
 * isso significa e oferece trocar para um novo a qualquer momento — e
 * também exportar uma collection do Postman com um exemplo de cada
 * operação, para quem quiser testar a API fora do comparador.
 */
@Component({
  selector: 'app-sandbox-info',
  standalone: true,
  imports: [],
  templateUrl: './sandbox-info.component.html',
  styleUrl: './sandbox-info.component.css',
})
export class SandboxInfoComponent {
  constructor(
    public sessaoService: SessaoService,
    private postmanExportService: PostmanExportService,
  ) {}

  // Só os 8 primeiros caracteres do id do sandbox — o suficiente para
  // diferenciar sandboxes visualmente sem virar uma string ilegível na tela.
  public sandboxIdCurto = computed(() => this.sessaoService.id().slice(0, 8));

  novoSandbox() {
    const confirmou = confirm(
      'Trocar de sandbox começa do zero: os cursos criados/alterados no sandbox atual ' +
      'deixam de aparecer (mas continuam existindo até expirarem por inatividade). Continuar?'
    );
    if (confirmou) {
      this.sessaoService.novaSessao();
    }
  }

  exportarPostman() {
    this.postmanExportService.exportar();
  }
}
