import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { TemaClaroEscuroSignalService } from '../../../services/tema-claro-escuro-signal/tema-claro-escuro-signal.service';
import { By } from '@angular/platform-browser';

describe('HeaderComponent (integração tema claro/escuro)', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let service: TemaClaroEscuroSignalService;
  let imgElement: HTMLImageElement;

  beforeEach(async () => {
    // Limpa localStorage e document
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [TemaClaroEscuroSignalService],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TemaClaroEscuroSignalService);
    fixture.detectChanges();

    imgElement = fixture.debugElement.query(By.css('img')).nativeElement;
  });

  it('deve iniciar no tema escuro por padrão', () => {
    expect(service.escuro()).toBe(true);
    expect(localStorage.getItem('tema')).toBe('escuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('escuro');
    expect(imgElement.src).toContain('tema-claro.svg');
    expect(imgElement.title).toBe('Mude para o tema claro');
  });

  it('deve mudar para tema claro ao clicar no ícone', async () => {
    imgElement.click();
    fixture.detectChanges();

    expect(service.escuro()).toBe(false);
    expect(localStorage.getItem('tema')).toBe('claro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('claro');
    expect(imgElement.src).toContain('tema-escuro.svg');
    expect(imgElement.title).toBe('Mude para o tema escuro');
  });

  it('deve alternar corretamente várias vezes (escuro → claro → escuro)', () => {
    // Escuro (padrão)
    expect(service.escuro()).toBe(true);
    imgElement.click(); // vira claro
    fixture.detectChanges();
    expect(service.escuro()).toBe(false);
    imgElement.click(); // volta escuro
    fixture.detectChanges();
    expect(service.escuro()).toBe(true);
  });
});
