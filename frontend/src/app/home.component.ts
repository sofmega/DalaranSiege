import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameDataService, HeroDto, ItemDto, ItemRequirement, Shop } from './game-data.service';

type ViewMode = 'heroes' | 'items';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private readonly gameDataService = inject(GameDataService);

  protected readonly activeView = signal<ViewMode>('heroes');
  protected readonly heroes = signal<HeroDto[]>([]);
  protected readonly items = signal<ItemDto[]>([]);
  protected readonly shops = signal<Shop[]>([]);
  protected readonly selectedShopId = signal('');
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly brokenIconIds = signal(new Set<string>());
  private pendingRequests = 3;

  constructor() {
    this.loadHeroes();
    this.loadItems();
    this.loadShops();
  }

  protected showHeroes(): void {
    this.activeView.set('heroes');
  }

  protected showItems(): void {
    this.activeView.set('items');
  }

  protected selectShop(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedShopId.set(select.value);
  }

  protected filteredItems(): ItemDto[] {
    const shopId = this.selectedShopId();

    if (!shopId) {
      return this.items();
    }

    return this.items().filter((item) => item.shopIds.includes(shopId));
  }

  protected statEntries(stats: Record<string, unknown>): Array<[string, unknown]> {
    return Object.entries(stats);
  }

  protected formatLabel(value: string): string {
    return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
  }

  protected formatRequirement(requirement: ItemRequirement): string {
    return `${requirement.quantity}x ${this.formatLabel(requirement.itemId).replaceAll('-', ' ')}`;
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

  private loadHeroes(): void {
    this.gameDataService.getHeroes().subscribe({
      next: (heroes) => {
        this.heroes.set(heroes);
        this.finishRequest();
      },
      error: () => {
        this.errorMessage.set('Could not load heroes. Make sure Spring Boot is running on port 8081.');
        this.finishRequest();
      }
    });
  }

  private loadItems(): void {
    this.gameDataService.getItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.finishRequest();
      },
      error: () => {
        this.errorMessage.set('Could not load items. Make sure Spring Boot is running on port 8081.');
        this.finishRequest();
      }
    });
  }

  private loadShops(): void {
    this.gameDataService.getShops().subscribe({
      next: (shops) => {
        this.shops.set(shops);
        this.finishRequest();
      },
      error: () => {
        this.errorMessage.set('Could not load shops. Make sure Spring Boot is running on port 8081.');
        this.finishRequest();
      }
    });
  }

  private finishRequest(): void {
    this.pendingRequests -= 1;

    if (this.pendingRequests <= 0) {
      this.isLoading.set(false);
    }
  }
}
