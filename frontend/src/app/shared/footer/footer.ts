import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="app-footer">
      <span>© {{ year }} SportSphere Hub — PIA projekat</span>
      <a routerLink="/">Povratak na početnu</a>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #143a5a;
        color: #d7e6f2;
        font-size: 0.85rem;
        margin-top: auto;
      }
      .app-footer a {
        color: #9ecbed;
      }
    `,
  ],
})
export class Footer {
  year = new Date().getFullYear();
}
