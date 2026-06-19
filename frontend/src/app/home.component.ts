import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameDataService, HeroDto, ItemDto, ItemRequirement, Shop } from './game-data.service';
import { calculateTotalItemCost, itemShopNames, shouldShowItemDescription } from './item-data.utils';
import { SeoService } from './seo.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { ThemeToggleComponent } from './theme-toggle.component';

type ViewMode = 'heroes' | 'items';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ThemeToggleComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gameDataService = inject(GameDataService);
  private readonly seo = inject(SeoService);
  protected readonly authService = inject(SupabaseAuthService);

  protected readonly activeView = signal<ViewMode>('heroes');
  protected readonly heroes = signal<HeroDto[]>([]);
  protected readonly items = signal<ItemDto[]>([]);
  protected readonly shops = signal<Shop[]>([]);
  protected readonly selectedShopId = signal('');
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly brokenIconIds = signal(new Set<string>());
  private pendingRequests = 3;

  protected readonly itemById = computed(() => new Map(this.items().map((item) => [item.id, item])));
  private readonly shopById = computed(() => new Map(this.shops().map((shop) => [shop.id, shop])));
  private readonly totalCosts = computed(() => {
    const costs = new Map<string, number>();
    const itemById = this.itemById();
    this.items().forEach((item) => calculateTotalItemCost(item, itemById, costs));
    return costs;
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const view: ViewMode = params.get('view') === 'items' ? 'items' : 'heroes';
      this.activeView.set(view);
      this.seo.setPage(view === 'items'
        ? {
            title: 'Warcraft III Items and Crafting Recipes',
            description: 'Browse DalaranSiege items, total gold costs, shop locations, bonuses, and recursive crafting recipes.',
            path: '/?view=items'
          }
        : {
            title: 'DalaranSiege Heroes and Community Builds',
            description: 'Explore DalaranSiege heroes and discover community-created Warcraft III item builds.',
            path: '/'
          });
    });

    this.loadHeroes();
    this.loadItems();
    this.loadShops();
  }

  protected signOut(): void {
    void this.authService.signOut();
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

  protected formatLabel(value: string): string {
    return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
  }

  protected formatRequirement(requirement: ItemRequirement): string {
    const item = this.itemById().get(requirement.itemId);
    return `${requirement.quantity}× ${item?.name ?? this.formatLabel(requirement.itemId).replaceAll('-', ' ')}`;
  }

  protected totalItemCost(item: ItemDto): number {
    return this.totalCosts().get(item.id) ?? item.price;
  }

  protected shopNamesForItem(item: ItemDto): string {
    const names = itemShopNames(item, this.shopById());
    return names.length ? names.join(', ') : 'Not listed';
  }

  protected shouldShowDescription(item: ItemDto): boolean {
    return shouldShowItemDescription(item);
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
