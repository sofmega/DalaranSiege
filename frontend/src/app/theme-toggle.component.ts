import { Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="themeService.toggle()"
      [attr.aria-label]="'Switch to ' + (themeService.theme() === 'light' ? 'dark' : 'light') + ' theme'"
    >
      {{ themeService.theme() === 'light' ? 'Dark' : 'Light' }}
    </button>
  `
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);
}
