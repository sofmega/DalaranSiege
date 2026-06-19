import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    TestBed.resetTestingModule();
  });

  it('restores a saved theme', () => {
    localStorage.setItem('dalaran-theme', 'dark');

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('uses the system preference when no theme is saved', () => {
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
  });

  it('persists theme changes', () => {
    localStorage.setItem('dalaran-theme', 'light');
    const service = TestBed.inject(ThemeService);

    service.toggle();

    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('dalaran-theme')).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
