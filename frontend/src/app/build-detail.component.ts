import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameDataService, HeroBuildDto, HeroDto, ItemDto } from './game-data.service';
import { SupabaseAuthService } from './supabase-auth.service';

type BuildSection = 'early' | 'core' | 'optional';

@Component({
  selector: 'app-build-detail',
  imports: [RouterLink],
  templateUrl: './build-detail.component.html'
})
export class BuildDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gameDataService = inject(GameDataService);
  protected readonly authService = inject(SupabaseAuthService);
  protected readonly heroId = this.route.snapshot.paramMap.get('heroId') ?? '';
  private readonly buildId = this.route.snapshot.paramMap.get('buildId') ?? '';

  protected readonly hero = signal<HeroDto | null>(null);
  protected readonly build = signal<HeroBuildDto | null>(null);
  protected readonly items = signal<ItemDto[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly authMessage = signal('');
  protected readonly brokenIconIds = signal(new Set<string>());
  private pendingRequests = 3;

  protected readonly buildSections: ReadonlyArray<{
    key: BuildSection;
    label: string;
    description: string;
  }> = [
    { key: 'early', label: 'Early Build', description: 'Opening items and first purchases.' },
    { key: 'core', label: 'Core Build', description: 'The essential items for this build.' },
    { key: 'optional', label: 'Optional', description: 'Situational and alternative choices.' }
  ];

  private readonly itemById = computed(() => new Map(this.items().map((item) => [item.id, item])));

  constructor() {
    this.loadHero();
    this.loadItems();
    this.loadBuild();
  }

  protected vote(vote: -1 | 1): void {
    const build = this.build();
    if (!build) {
      return;
    }
    if (!this.authService.isAuthenticated()) {
      this.authMessage.set('Login to vote on builds.');
      return;
    }

    const nextVote = build.currentUserVote === vote ? 0 : vote;
    this.gameDataService.voteBuild(build.id, nextVote).subscribe({
      next: (updatedBuild) => {
        this.build.set(updatedBuild);
        this.authMessage.set('');
      },
      error: () => {
        this.authMessage.set('Could not save your vote. Check that you are still logged in.');
      }
    });
  }

  protected sectionItems(build: HeroBuildDto, section: BuildSection): ItemDto[] {
    const ids = section === 'early'
      ? build.earlyItems ?? []
      : section === 'core'
        ? build.coreItems ?? build.itemIds ?? []
        : build.optionalItems ?? [];
    const itemById = this.itemById();
    return ids
      .map((itemId) => itemById.get(itemId))
      .filter((item): item is ItemDto => item !== undefined);
  }

  protected signOut(): void {
    void this.authService.signOut();
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
        this.hero.set(heroes.find((hero) => hero.id === this.heroId) ?? null);
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

  private loadBuild(): void {
    this.gameDataService.getBuilds(this.heroId).subscribe({
      next: (builds) => {
        const build = builds.find((candidate) => candidate.id === this.buildId) ?? null;
        this.build.set(build);
        if (!build) {
          this.errorMessage.set('Build not found.');
        }
        this.finishLoading();
      },
      error: () => {
        this.errorMessage.set('Could not load this build.');
        this.finishLoading();
      }
    });
  }

  private finishLoading(): void {
    this.pendingRequests -= 1;
    if (this.pendingRequests <= 0) {
      this.isLoading.set(false);
    }
  }
}
