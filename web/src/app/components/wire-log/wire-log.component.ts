import { Component, effect, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RegistroWire, ResumoLeg, WireLogService } from '../../services/wire-log/wire-log.service';

/**
 * Painel do wire log: mostra, por sandbox, o tráfego real medido no servidor
 * para cada chamada REST/GraphQL/SOAP feita pelo comparador — bytes, duração
 * e over-fetching. Veja api/README.md e src/Wire para o porquê disso viver
 * no servidor, e não em métricas calculadas no próprio browser.
 */
@Component({
  selector: 'app-wire-log',
  standalone: true,
  imports: [NgClass],
  templateUrl: './wire-log.component.html',
  styleUrl: './wire-log.component.css',
})
export class WireLogComponent {
  public isOpen = signal(false);
  public carregando = signal(false);
  public resumoPorLeg = signal<Record<string, ResumoLeg>>({});
  public registros = signal<RegistroWire[]>([]);

  public legs: readonly string[] = ['REST', 'GraphQL', 'SOAP'];

  constructor(private wireLogService: WireLogService) {
    // Se atualiza sozinho sempre que uma chamada REST/GraphQL/SOAP termina
    // (veja CursoApiService), mas só busca de fato enquanto o painel estiver
    // aberto — não faz sentido gastar requisição com o painel escondido.
    effect(() => {
      this.wireLogService.atualizacoes();
      if (this.isOpen()) {
        this.atualizar();
      }
    }, { allowSignalWrites: true });
  }

  toggle() {
    this.isOpen.set(!this.isOpen());
  }

  atualizar() {
    this.carregando.set(true);
    this.wireLogService.obter().subscribe({
      next: (resposta) => {
        this.resumoPorLeg.set(resposta.resumoPorLeg);
        // Mais recente primeiro.
        this.registros.set([...resposta.registros].reverse());
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  limpar() {
    this.carregando.set(true);
    this.wireLogService.limpar().subscribe({
      next: () => this.atualizar(),
      error: () => this.carregando.set(false),
    });
  }

  legClass(leg: string): string {
    return 'leg-' + leg.toLowerCase();
  }
}
