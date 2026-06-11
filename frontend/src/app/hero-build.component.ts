import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameDataService, HeroBuildDto, HeroDto, ItemDto } from './game-data.service';
import { SupabaseAuthService } from './supabase-auth.service';

type BuildMode = 'view' | 'create';

@Component({
  selector: 'app-hero-build',
  imports: [FormsModule, RouterLink],
  templateUrl: './hero-build.component.html'
})
export class HeroBuildComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gameDataService = inject(GameDataService);
  protected readonly authService = inject(SupabaseAuthService);
  private readonly heroId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly mode = signal<BuildMode>('view');
  protected readonly hero = signal<HeroDto | null>(null);
  protected readonly items = signal<ItemDto[]>([]);
  protected readonly builds = signal<HeroBuildDto[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly brokenIconIds = signal(new Set<string>());
  protected readonly buildName = signal('');
  protected readonly selectedItemIds = signal<string[]>([]);
  protected readonly notes = signal('');
  protected readonly authMessage = signal('');
  protected readonly editingBuildId = signal<string | null>(null);
  private pendingRequests = 3;

  protected readonly selectedItems = computed(() => {
    const selectedIds = new Set(this.selectedItemIds());
    return this.items().filter((item) => selectedIds.has(item.id));
  });

  protected readonly itemById = computed(() => new Map(this.items().map((item) => [item.id, item])));

  constructor() {
    this.loadHero();
    this.loadItems();
    this.loadBuilds();
  }

  protected showView(): void {
    this.mode.set('view');
  }

  protected showCreate(): void {
    if (!this.authService.isAuthenticated()) {
      this.authMessage.set('Login to create and save builds.');
      this.mode.set('view');
      return;
    }

    this.editingBuildId.set(null);
    this.buildName.set(`${this.hero()?.name ?? 'Hero'} Build`);
    this.selectedItemIds.set([]);
    this.notes.set('');
    this.authMessage.set('');
    this.mode.set('create');
  }

  protected editBuild(build: HeroBuildDto): void {
    if (!this.isOwner(build)) {
      return;
    }

    this.editingBuildId.set(build.id);
    this.buildName.set(build.name);
    this.selectedItemIds.set(build.itemIds);
    this.notes.set(build.notes);
    this.authMessage.set('');
    this.mode.set('create');
  }

  protected signOut(): void {
    void this.authService.signOut();
    this.mode.set('view');
  }

  protected toggleItem(itemId: string): void {
    const selected = this.selectedItemIds();

    if (selected.includes(itemId)) {
      this.selectedItemIds.set(selected.filter((id) => id !== itemId));
      return;
    }

    if (selected.length >= 6) {
      return;
    }

    this.selectedItemIds.set([...selected, itemId]);
  }

  protected updateBuildName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.buildName.set(input.value);
  }

  protected updateNotes(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.notes.set(textarea.value);
  }

  protected saveBuild(): void {
    if (!this.authService.isAuthenticated()) {
      this.authMessage.set('Login to create and save builds.');
      this.mode.set('view');
      return;
    }

    const editingBuildId = this.editingBuildId();
    const request = {
      name: this.buildName().trim() || `${this.hero()?.name ?? 'Hero'} Build`,
      itemIds: this.selectedItemIds(),
      notes: this.notes().trim()
    };

    const saveRequest = editingBuildId
      ? this.gameDataService.updateBuild(editingBuildId, request)
      : this.gameDataService.createBuild({
      heroId: this.heroId,
      ...request
    });

    saveRequest.subscribe({
      next: (build) => {
        this.builds.update((builds) => {
          const withoutSaved = builds.filter((candidate) => candidate.id !== build.id);
          return [build, ...withoutSaved].sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt));
        });
        this.buildName.set(`${this.hero()?.name ?? 'Hero'} Build`);
        this.editingBuildId.set(null);
        this.selectedItemIds.set([]);
        this.notes.set('');
        this.authMessage.set('');
        this.mode.set('view');
      },
      error: (error) => {
        this.authMessage.set(error?.error?.message ?? 'Could not save this build. Check that you are still logged in.');
      }
    });
  }

  protected deleteBuild(build: HeroBuildDto): void {
    if (!this.isOwner(build)) {
      return;
    }

    this.gameDataService.deleteBuild(build.id).subscribe({
      next: () => {
        this.builds.update((builds) => builds.filter((candidate) => candidate.id !== build.id));
        this.authMessage.set('');
      },
      error: (error) => {
        this.authMessage.set(error?.error?.message ?? 'Could not delete this build.');
      }
    });
  }

  protected vote(build: HeroBuildDto, vote: -1 | 1): void {
    if (!this.authService.isAuthenticated()) {
      this.authMessage.set('Login to vote on builds.');
      return;
    }

    const nextVote = build.currentUserVote === vote ? 0 : vote;
    this.gameDataService.voteBuild(build.id, nextVote).subscribe({
      next: (updatedBuild) => {
        this.builds.update((builds) => builds
          .map((candidate) => candidate.id === updatedBuild.id ? updatedBuild : candidate)
          .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt)));
        this.authMessage.set('');
      },
      error: () => {
        this.authMessage.set('Could not save your vote. Check that you are still logged in.');
      }
    });
  }

  protected buildItems(build: HeroBuildDto): ItemDto[] {
    const itemById = this.itemById();
    return build.itemIds
      .map((itemId) => itemById.get(itemId))
      .filter((item): item is ItemDto => item !== undefined);
  }

  protected isOwner(build: HeroBuildDto): boolean {
    return this.authService.userId() === build.authorId;
  }

  protected isSelected(itemId: string): boolean {
    return this.selectedItemIds().includes(itemId);
  }

  protected markImageBroken(iconId: string): void {
    this.brokenIconIds.update((ids) => new Set(ids).add(iconId));
  }

  protected isImageBroken(iconId: string): boolean {
    return this.brokenIconIds().has(iconId);
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private loadHero(): void {
    this.gameDataService.getHeroes().subscribe({
      next: (heroes) => {
        const hero = heroes.find((candidate) => candidate.id === this.heroId) ?? null;
        this.hero.set(hero);
        this.buildName.set(`${hero?.name ?? 'Hero'} Build`);
        this.finishLoading();
      },
      error: () => {
        this.errorMessage.set('Could not load hero data.');
        this.finishLoading();
      }
    });
  }

  private loadItems(): void {
    this.gameDataService.getItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.finishLoading();
      },
      error: () => {
        this.errorMessage.set('Could not load item data.');
        this.finishLoading();
      }
    });
  }

  private loadBuilds(): void {
    this.gameDataService.getBuilds(this.heroId).subscribe({
      next: (builds) => {
        this.builds.set(builds);
        this.finishLoading();
      },
      error: () => {
        this.errorMessage.set('Could not load hero builds.');
        this.finishLoading();
      }
    });
  }

  private finishLoading(): void {
    this.pendingRequests -= 1;

    if (this.pendingRequests <= 0 || this.errorMessage()) {
      this.isLoading.set(false);
    }
  }
}
