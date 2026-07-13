import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CompositionApiService, CompositionDto } from './composition-api.service';
import { GameDataService, HeroDto } from './game-data.service';
import { SeoService } from './seo.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { ThemeToggleComponent } from './theme-toggle.component';

type CompositionMode = 'view' | 'create';

@Component({
  selector: 'app-composition-list',
  imports: [DatePipe, RouterLink, ThemeToggleComponent],
  templateUrl: './composition-list.component.html'
})
export class CompositionListComponent {
  private readonly api = inject(CompositionApiService);
  private readonly gameData = inject(GameDataService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  protected readonly authService = inject(SupabaseAuthService);

  protected readonly mode = signal<CompositionMode>('view');
  protected readonly compositions = signal<CompositionDto[]>([]);
  protected readonly heroes = signal<HeroDto[]>([]);
  protected readonly name = signal('');
  protected readonly notes = signal('');
  protected readonly selectedHeroIds = signal<string[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly authMessage = signal('');
  protected readonly brokenIconIds = signal(new Set<string>());
  private pendingRequests = 2;

  protected readonly selectedHeroes = computed(() => {
    const byId = new Map(this.heroes().map((hero) => [hero.id, hero]));
    return this.selectedHeroIds().flatMap((id) => byId.get(id) ?? []);
  });
  protected readonly ownedCompositions = computed(() =>
    this.compositions().filter((composition) => composition.ownedByCurrentUser)
  );
  protected readonly hasReachedLimit = computed(() => this.ownedCompositions().length >= 4);
  protected readonly isValid = computed(() => {
    const nameLength = this.name().trim().length;
    const heroCount = this.selectedHeroIds().length;
    return nameLength >= 3 && nameLength <= 80 && this.notes().trim().length <= 2000 && heroCount >= 1 && heroCount <= 6;
  });

  constructor() {
    this.seo.setPage({
      title: 'Community Compositions',
      description: 'Browse and share community hero compositions for DalaranSiege.',
      path: '/compositions'
    });
    this.loadCompositions();
    this.loadHeroes();
  }

  protected showView(): void {
    this.mode.set('view');
  }

  protected showCreate(): void {
    if (!this.authService.isAuthenticated()) {
      this.authMessage.set('Login to create a composition.');
      return;
    }
    if (this.hasReachedLimit()) {
      this.authMessage.set('You already have 4 compositions. Delete an old composition before creating another one.');
      return;
    }
    this.authMessage.set('');
    this.mode.set('create');
  }

  protected updateName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  protected updateNotes(event: Event): void {
    this.notes.set((event.target as HTMLTextAreaElement).value);
  }

  protected toggleHero(heroId: string): void {
    const selected = this.selectedHeroIds();
    if (selected.includes(heroId)) {
      this.selectedHeroIds.set(selected.filter((id) => id !== heroId));
    } else if (selected.length < 6) {
      this.selectedHeroIds.set([...selected, heroId]);
    }
  }

  protected removeHero(heroId: string): void {
    this.selectedHeroIds.update((ids) => ids.filter((id) => id !== heroId));
  }

  protected moveHero(index: number, direction: -1 | 1): void {
    const target = index + direction;
    const ids = [...this.selectedHeroIds()];
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.selectedHeroIds.set(ids);
  }

  protected saveComposition(): void {
    if (!this.authService.isAuthenticated()) {
      this.authMessage.set('Login to create a composition.');
      return;
    }
    if (!this.isValid() || this.isSaving()) return;
    this.isSaving.set(true);
    this.authMessage.set('');
    this.api.createComposition({
      name: this.name().trim(),
      notes: this.notes().trim(),
      heroIds: this.selectedHeroIds()
    }).subscribe({
      next: (composition) => void this.router.navigate(['/compositions', composition.id]),
      error: (error) => {
        this.isSaving.set(false);
        this.authMessage.set(error?.error?.message ?? 'Could not save this composition.');
      }
    });
  }

  protected vote(composition: CompositionDto, vote: -1 | 1): void {
    if (!this.authService.isAuthenticated()) {
      this.authMessage.set('Login to vote on compositions.');
      return;
    }
    const nextVote = composition.currentUserVote === vote ? 0 : vote;
    this.api.voteComposition(composition.id, nextVote).subscribe({
      next: (updated) => {
        this.compositions.update((items) => items
          .map((item) => item.id === updated.id ? updated : item)
          .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt)));
        this.authMessage.set('');
      },
      error: (error) => this.authMessage.set(error?.error?.message ?? 'Could not save your vote.')
    });
  }

  protected signOut(): void {
    void this.authService.signOut();
    this.mode.set('view');
  }

  protected isSelected(heroId: string): boolean {
    return this.selectedHeroIds().includes(heroId);
  }

  protected markImageBroken(id: string): void {
    this.brokenIconIds.update((ids) => new Set(ids).add(id));
  }

  protected isImageBroken(id: string): boolean {
    return this.brokenIconIds().has(id);
  }

  protected initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  private loadCompositions(): void {
    this.api.getCompositions().subscribe({
      next: (compositions) => {
        this.compositions.set(compositions);
        this.finishLoading();
      },
      error: () => {
        this.errorMessage.set('Could not load community compositions.');
        this.finishLoading();
      }
    });
  }

  private loadHeroes(): void {
    this.gameData.getHeroes().subscribe({
      next: (heroes) => {
        this.heroes.set(heroes);
        this.finishLoading();
      },
      error: () => {
        this.errorMessage.set('Could not load hero data.');
        this.finishLoading();
      }
    });
  }

  private finishLoading(): void {
    this.pendingRequests -= 1;
    if (this.pendingRequests <= 0) this.isLoading.set(false);
  }
}
