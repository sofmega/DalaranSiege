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

export interface HeroBuildDto {
  id: string;
  heroId: string;
  name: string;
  notes: string;
  authorId: string;
  authorName: string;
  itemIds: string[];
  score: number;
  upvotes: number;
  downvotes: number;
  currentUserVote: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildRequest {
  heroId: string;
  name: string;
  notes: string;
  itemIds: string[];
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

  getBuilds(heroId: string) {
    return this.http.get<HeroBuildDto[]>(`/api/builds?heroId=${encodeURIComponent(heroId)}`);
  }

  createBuild(request: CreateBuildRequest) {
    return this.http.post<HeroBuildDto>('/api/builds', request);
  }

  updateBuild(buildId: string, request: Omit<CreateBuildRequest, 'heroId'>) {
    return this.http.put<HeroBuildDto>(`/api/builds/${buildId}`, request);
  }

  deleteBuild(buildId: string) {
    return this.http.delete<void>(`/api/builds/${buildId}`);
  }

  voteBuild(buildId: string, vote: -1 | 0 | 1) {
    return this.http.post<HeroBuildDto>(`/api/builds/${buildId}/vote`, { vote });
  }
}
