import { Injectable, Signal, signal } from '@angular/core';

/**
 * O identificador do sandbox.
 *
 * Não é login e não é usuário: é um id que este navegador gera e guarda para
 * que a API saiba qual sandbox de cursos, descartável, é o seu. Nenhum dado
 * pessoal entra aqui, e é por isso que não há cookie nem banner de consentimento.
 *
 * Fica no localStorage de propósito: recarregar a página não deve jogar fora
 * o que você estava testando. Trocar de sandbox (ver `novaSessao`) é como
 * "esquecer" os dados do sandbox anterior e recomeçar do zero — sem afetar
 * nenhum outro visitante, já que cada um tem o seu (veja api/README.md).
 */
const CHAVE = 'api-comparator:sessao';

@Injectable({
  providedIn: 'root',
})
export class SessaoService {
  private readonly idSignal = signal<string>(this.carregarOuGerar());

  /** Id do sandbox atual, reativo — muda quando `novaSessao()` é chamado. */
  readonly id: Signal<string> = this.idSignal.asReadonly();

  idDaSessao(): string {
    return this.idSignal();
  }

  /** Troca de sandbox sem esperar o TTL. É o botão "novo sandbox" do header. */
  novaSessao(): string {
    const novo = this.gerar();
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      /* segue com o id em memória */
    }
    this.idSignal.set(novo);
    return novo;
  }

  private carregarOuGerar(): string {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) {
        return salvo;
      }
      const novo = this.gerar();
      localStorage.setItem(CHAVE, novo);
      return novo;
    } catch {
      // Modo privado ou storage bloqueado: um id por carregamento ainda
      // funciona, só não sobrevive ao refresh.
      return this.gerar();
    }
  }

  private gerar(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
