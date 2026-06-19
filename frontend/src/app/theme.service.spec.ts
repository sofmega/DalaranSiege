import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('restores a saved theme', () => {
    localStorage.setItem('dalaran-theme', 'dark');

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('defaults to light when no theme is saved', () => {
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
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
