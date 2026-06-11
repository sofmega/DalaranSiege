import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameDataService, HeroDto, ItemDto } from './game-data.service';

type BuildMode = 'view' | 'create';

interface SavedBuild {
  name: string;
  itemIds: string[];
  notes: string;
}

@Component({
  selector: 'app-hero-build',
  imports: [FormsModule, RouterLink],
  templateUrl: './hero-build.component.html'
})
export class HeroBuildComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gameDataService = inject(GameDataService);
  private readonly heroId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly mode = signal<BuildMode>('view');
  protected readonly hero = signal<HeroDto | null>(null);
  protected readonly items = signal<ItemDto[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly brokenIconIds = signal(new Set<string>());
  protected readonly buildName = signal('');
  protected readonly selectedItemIds = signal<string[]>([]);
  protected readonly notes = signal('');
  private pendingRequests = 2;

  protected readonly selectedItems = computed(() => {
    const selectedIds = new Set(this.selectedItemIds());
    return this.items().filter((item) => selectedIds.has(item.id));
  });

  protected readonly featuredItems = computed(() => {
    const chosen = this.selectedItems();

    if (chosen.length) {
      return chosen;
    }

    return this.items().slice(0, 6);
  });

  constructor() {
    this.loadHero();
    this.loadItems();
  }

  protected showView(): void {
    this.mode.set('view');
  }

  protected showCreate(): void {
    this.mode.set('create');
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
    const savedBuild: SavedBuild = {
      name: this.buildName().trim() || `${this.hero()?.name ?? 'Hero'} Build`,
      itemIds: this.selectedItemIds(),
      notes: this.notes().trim()
    };

    localStorage.setItem(this.storageKey(), JSON.stringify(savedBuild));
    this.buildName.set(savedBuild.name);
    this.notes.set(savedBuild.notes);
    this.mode.set('view');
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
        this.restoreBuild();
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
        this.restoreBuild();
        this.finishLoading();
      },
      error: () => {
        this.errorMessage.set('Could not load item data.');
        this.finishLoading();
      }
    });
  }

  private restoreBuild(): void {
    const saved = localStorage.getItem(this.storageKey());

    if (!saved) {
      return;
    }

    try {
      const build = JSON.parse(saved) as SavedBuild;
      this.buildName.set(build.name);
      this.selectedItemIds.set(build.itemIds ?? []);
      this.notes.set(build.notes ?? '');
    } catch {
      localStorage.removeItem(this.storageKey());
    }
  }

  private finishLoading(): void {
    this.pendingRequests -= 1;

    if (this.pendingRequests <= 0 || this.errorMessage()) {
      this.isLoading.set(false);
    }
  }

  private storageKey(): string {
    return `dalaran-build:${this.heroId}`;
  }
}
