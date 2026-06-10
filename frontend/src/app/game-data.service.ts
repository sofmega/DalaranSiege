import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface HeroDto {
  id: string;
  name: string;
  heroClass: string;
  roles: string[];
  iconUrl: string;
}

export interface ItemDto {
  id: string;
  name: string;
  itemClass: string;
  price: number;
  bonuses: string[];
  description: string;
  range: number | null;
  stats: Record<string, unknown>;
  requirements: ItemRequirement[];
  shopIds: string[];
  iconUrl: string;
}

export interface ItemRequirement {
  itemId: string;
  quantity: number;
}

export interface Shop {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class GameDataService {
  private readonly http = inject(HttpClient);

  getHeroes() {
    return this.http.get<HeroDto[]>('/api/v1/heroes');
  }

  getItems(shopId = '') {
    const url = shopId ? `/api/items?shopId=${encodeURIComponent(shopId)}` : '/api/items';
    return this.http.get<ItemDto[]>(url);
  }

  getShops() {
    return this.http.get<Shop[]>('/api/shops');
  }
}
