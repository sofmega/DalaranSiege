import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'dalaran-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly currentTheme = signal<Theme>(this.initialTheme());

  readonly theme = this.currentTheme.asReadonly();

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  toggle(): void {
    const nextTheme: Theme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(nextTheme);
    this.applyTheme(nextTheme);

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Theme still works when browser storage is unavailable.
    }
  }

  private initialTheme(): Theme {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // Fall through to the system preference.
    }

    return 'light';
  }

  private applyTheme(theme: Theme): void {
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.style.colorScheme = theme;
  }
}
