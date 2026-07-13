import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
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

  it('should open and close the About panel', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const trigger = compiled.querySelector<HTMLButtonElement>('.about-trigger');

    trigger?.click();
    fixture.detectChanges();

    const panel = compiled.querySelector<HTMLElement>('#about-panel');
    const repositoryLink = panel?.querySelector<HTMLAnchorElement>('a');

    expect(panel).toBeTruthy();
    expect(repositoryLink?.getAttribute('href')).toBe(
      'https://github.com/sofmega/DalaranSiege'
    );

    panel?.querySelector<HTMLButtonElement>('.about-close')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('#about-panel')).toBeNull();
  });
});
