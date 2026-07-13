import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { CompositionApiService, CompositionDto } from './composition-api.service';
import { CompositionListComponent } from './composition-list.component';
import { GameDataService, HeroDto } from './game-data.service';
import { SeoService } from './seo.service';
import { SupabaseAuthService } from './supabase-auth.service';

describe('CompositionListComponent', () => {
  let fixture: ComponentFixture<CompositionListComponent>;
  const authenticated = signal(false);
  const api = {
    getCompositions: vi.fn(),
    createComposition: vi.fn(),
    voteComposition: vi.fn()
  };
  const heroes: HeroDto[] = Array.from({ length: 7 }, (_, index) => ({
    id: `hero-${index + 1}`,
    name: `Hero ${index + 1}`,
    heroClass: 'Warrior',
    roles: ['Tank'],
    iconUrl: `/hero-${index + 1}.png`
  }));
  const composition: CompositionDto = {
    id: 'composition-1', name: 'Strong team fight', notes: '', authorId: 'user-1', authorName: 'Player',
    heroes: heroes.slice(0, 2).map((hero, position) => ({ ...hero, position })),
    score: 2, upvotes: 2, downvotes: 0, currentUserVote: null, ownedByCurrentUser: false,
    createdAt: '2026-07-13T10:00:00Z', updatedAt: '2026-07-13T10:00:00Z'
  };

  beforeEach(async () => {
    authenticated.set(false);
    api.getCompositions.mockReturnValue(of([composition]));
    api.createComposition.mockReturnValue(of(composition));
    api.voteComposition.mockReturnValue(of(composition));
    await TestBed.configureTestingModule({
      imports: [CompositionListComponent],
      providers: [
        provideRouter([]),
        { provide: CompositionApiService, useValue: api },
        { provide: GameDataService, useValue: { getHeroes: () => of(heroes) } },
        { provide: SeoService, useValue: { setPage: vi.fn() } },
        { provide: SupabaseAuthService, useValue: {
          isAuthenticated: authenticated,
          userId: signal('user-1'),
          displayName: signal('Player'),
          signOut: vi.fn()
        } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CompositionListComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('renders both composition controls and public cards for guests without a permanent login banner', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('a[href="/compositions"]')?.textContent).toContain('Compos');
    expect(element.querySelector('.site-version')?.textContent).toContain('v1.19');
    expect(element.textContent).toContain('View Compos');
    expect(element.textContent).toContain('Create Composition');
    expect(element.textContent).toContain('Strong team fight');
    expect(element.textContent).toContain('Hero 1');
    expect(element.textContent).not.toContain('Anyone can browse compositions');
    expect(element.textContent).not.toContain('You need to log in or create an account');
  });

  it('shows a login-required create state to guests without rendering the form', () => {
    const createButton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Create Composition'));
    createButton?.click();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('You need to log in or create an account to create a composition.');
    expect(element.textContent).toContain('Login or register');
    expect(element.querySelector('#composition-name')).toBeNull();
    expect(element.querySelector('.composition-hero-picker')).toBeNull();
  });

  it('shows the creation form instead of the guest message to authenticated users', () => {
    authenticated.set(true);
    fixture.detectChanges();
    const createButton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Create Composition'));
    createButton?.click();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#composition-name')).not.toBeNull();
    expect(element.querySelector('.composition-hero-picker')).not.toBeNull();
    expect(element.textContent).not.toContain('You need to log in or create an account');
  });

  it('selects, removes, and never duplicates heroes', () => {
    const component = fixture.componentInstance as any;
    component.toggleHero('hero-1');
    component.toggleHero('hero-1');
    expect(component.selectedHeroIds()).toEqual([]);
    component.toggleHero('hero-1');
    component.toggleHero('hero-2');
    component.removeHero('hero-1');
    expect(component.selectedHeroIds()).toEqual(['hero-2']);
  });

  it('limits selection to six and updates the counter', () => {
    const component = fixture.componentInstance as any;
    heroes.forEach((hero) => component.toggleHero(hero.id));
    expect(component.selectedHeroIds()).toHaveLength(6);
    authenticated.set(true);
    component.showCreate();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('6/6');
  });

  it('keeps save disabled until the form is valid', () => {
    authenticated.set(true);
    const component = fixture.componentInstance as any;
    component.showCreate();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.save-build-button')?.disabled).toBe(true);
    component.name.set('My composition');
    component.toggleHero('hero-1');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.save-build-button')?.disabled).toBe(false);
  });

  it('navigates to the detail page after creation', () => {
    authenticated.set(true);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance as any;
    component.name.set('My composition');
    component.toggleHero('hero-1');
    component.saveComposition();
    expect(api.createComposition).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/compositions', composition.id]);
  });

  it('does not call the vote API for a guest', () => {
    (fixture.componentInstance as any).vote(composition, 1);
    expect(api.voteComposition).not.toHaveBeenCalled();
  });
});
