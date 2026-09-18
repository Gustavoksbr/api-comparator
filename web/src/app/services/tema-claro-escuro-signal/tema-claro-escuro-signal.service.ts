import {effect, Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemaClaroEscuroSignalService {
  public escuro = signal<boolean>(true);

  constructor() {
    const tema = localStorage.getItem("tema");
    if (tema === "escuro" || tema == null) {
      this.escuro.set(true);
    } else if (tema === "claro") {
      this.escuro.set(false);
    }

    effect(() => {
      const isEscuro = this.escuro();
      if (isEscuro) {
        localStorage.setItem("tema", "escuro");
        document.documentElement.setAttribute('data-theme', "escuro");
      } else {
        localStorage.setItem("tema", "claro");
        document.documentElement.setAttribute('data-theme', "claro");
      }
    });
  }
  changeTheme() {
    if(localStorage.getItem("tema") == "escuro" || localStorage.getItem("tema") == null){
      this.escuro.set(false);
    }
    else if (localStorage.getItem("tema") == "claro"){
      this.escuro.set(true);
    }
  }
}
