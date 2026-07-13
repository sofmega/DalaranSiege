import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the routed shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should toggle the accessible About panel', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const trigger = compiled.querySelector<HTMLButtonElement>('.about-trigger')!;

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(compiled.querySelector('#about-panel')).toBeNull();

    trigger.click();
    fixture.detectChanges();

    const panel = compiled.querySelector<HTMLElement>('#about-panel')!;
    const repositoryLink = panel.querySelector<HTMLAnchorElement>('a')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(repositoryLink.target).toBe('_blank');
    expect(repositoryLink.rel).toBe('noopener noreferrer');
  });

  it('should close the About panel with its close button or Escape', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const trigger = compiled.querySelector<HTMLButtonElement>('.about-trigger')!;
    trigger.click();
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.about-close')!.click();
    fixture.detectChanges();
    expect(compiled.querySelector('#about-panel')).toBeNull();

    trigger.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(compiled.querySelector('#about-panel')).toBeNull();
  });
});
