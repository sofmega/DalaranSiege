import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CompositionApiService, CompositionDto } from './composition-api.service';
import { CompositionDetailComponent } from './composition-detail.component';
import { SeoService } from './seo.service';
import { SupabaseAuthService } from './supabase-auth.service';

describe('CompositionDetailComponent', () => {
  const owned = signal(false);
  const composition: CompositionDto = {
    id: 'composition-1', name: 'Ordered heroes', notes: 'Hold the front line.', authorId: 'user-1', authorName: 'Player',
    heroes: [
      { position: 0, id: 'jaina', name: 'Jaina', heroClass: 'Mage', roles: ['Damage'], iconUrl: '/jaina.png' },
      { position: 1, id: 'arthas', name: 'Arthas', heroClass: 'Warrior', roles: ['Tank'], iconUrl: '/arthas.png' }
    ],
    score: 0, upvotes: 0, downvotes: 0, currentUserVote: null, ownedByCurrentUser: false,
    createdAt: '2026-07-13T10:00:00Z', updatedAt: '2026-07-13T10:00:00Z'
  };

  async function createFixture() {
    await TestBed.configureTestingModule({
      imports: [CompositionDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ compositionId: composition.id }) } } },
        { provide: CompositionApiService, useValue: {
          getComposition: () => of({ ...composition, ownedByCurrentUser: owned() }),
          voteComposition: vi.fn(),
          deleteComposition: vi.fn()
        } },
        { provide: SeoService, useValue: { setPage: vi.fn() } },
        { provide: SupabaseAuthService, useValue: {
          isAuthenticated: signal(true), displayName: signal('Player'), signOut: vi.fn()
        } }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(CompositionDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('displays heroes in their saved order', async () => {
    owned.set(false);
    const fixture = await createFixture();
    const names = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.composition-detail-hero h2')).map((node) => node.textContent?.trim());
    expect(names).toEqual(['Jaina', 'Arthas']);
  });

  it('shows delete only to the composition owner', async () => {
    owned.set(false);
    let fixture = await createFixture();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Delete Composition');
    TestBed.resetTestingModule();
    owned.set(true);
    fixture = await createFixture();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Delete Composition');
  });
});
