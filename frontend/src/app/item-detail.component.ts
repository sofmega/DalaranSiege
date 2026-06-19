import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameDataService, ItemDto, Shop } from './game-data.service';
import { calculateTotalItemCost, itemShopNames, shouldShowItemDescription } from './item-data.utils';
import { SupabaseAuthService } from './supabase-auth.service';
import { ThemeToggleComponent } from './theme-toggle.component';

interface RecipeTreeNode {
  item: ItemDto | null;
  itemId: string;
  quantity: number;
  depth: number;
  path: string;
  cycle: boolean;
}

@Component({
  selector: 'app-item-detail',
  imports: [RouterLink, ThemeToggleComponent],
  templateUrl: './item-detail.component.html'
})
export class ItemDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gameDataService = inject(GameDataService);
  protected readonly authService = inject(SupabaseAuthService);
  private readonly itemId = signal('');

  protected readonly items = signal<ItemDto[]>([]);
  protected readonly shops = signal<Shop[]>([]);
  protected readonly selectedItem = signal<ItemDto | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly brokenIconIds = signal(new Set<string>());
  private pendingRequests = 2;

  protected readonly itemById = computed(() => new Map(this.items().map((item) => [item.id, item])));
  private readonly shopById = computed(() => new Map(this.shops().map((shop) => [shop.id, shop])));
  private readonly totalCosts = computed(() => {
    const costs = new Map<string, number>();
    const itemById = this.itemById();
    this.items().forEach((item) => calculateTotalItemCost(item, itemById, costs));
    return costs;
  });

  protected readonly recipeTree = computed(() => {
    const item = this.selectedItem();
    return item ? this.buildRecipeTree(item) : [];
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.itemId.set(params.get('id') ?? '');
      this.selectCurrentItem();
    });
    this.loadItems();
    this.loadShops();
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

  private buildRecipeTree(rootItem: ItemDto): RecipeTreeNode[] {
    const nodes: RecipeTreeNode[] = [];
    const visit = (item: ItemDto, quantity: number, depth: number, path: string, ancestors: Set<string>) => {
      const cycle = ancestors.has(item.id);
      nodes.push({ item, itemId: item.id, quantity, depth, path, cycle });
      if (cycle) {
        return;
      }

      const nextAncestors = new Set(ancestors).add(item.id);
      item.requirements.forEach((requirement, index) => {
        const requiredItem = this.itemById().get(requirement.itemId) ?? null;
        const childPath = `${path}-${index}`;
        if (requiredItem) {
          visit(requiredItem, requirement.quantity, depth + 1, childPath, nextAncestors);
        } else {
          nodes.push({
            item: null,
            itemId: requirement.itemId,
            quantity: requirement.quantity,
            depth: depth + 1,
            path: childPath,
            cycle: false
          });
        }
      });
    };

    visit(rootItem, 1, 0, rootItem.id, new Set());
    return nodes;
  }

  private loadItems(): void {
    this.gameDataService.getItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.selectCurrentItem();
        this.finishLoading();
      },
      error: () => {
        this.errorMessage.set('Could not load item data.');
        this.finishLoading();
      }
    });
  }

  private selectCurrentItem(): void {
    const items = this.items();
    if (!items.length) {
      return;
    }

    const item = items.find((candidate) => candidate.id === this.itemId()) ?? null;
    this.selectedItem.set(item);
    this.errorMessage.set(item ? '' : 'Item not found.');
  }

  private loadShops(): void {
    this.gameDataService.getShops().subscribe({
      next: (shops) => {
        this.shops.set(shops);
        this.finishLoading();
      },
      error: () => {
        this.shops.set([]);
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
