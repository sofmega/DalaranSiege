import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface CompositionHeroDto {
  position: number;
  id: string;
  name: string;
  heroClass: string;
  roles: string[];
  iconUrl: string;
}

export interface CompositionDto {
  id: string;
  name: string;
  notes: string;
  authorId: string;
  authorName: string;
  heroes: CompositionHeroDto[];
  score: number;
  upvotes: number;
  downvotes: number;
  currentUserVote: number | null;
  ownedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompositionRequest {
  name: string;
  notes: string;
  heroIds: string[];
}

@Injectable({ providedIn: 'root' })
export class CompositionApiService {
  private readonly http = inject(HttpClient);

  getCompositions() {
    return this.http.get<CompositionDto[]>('/api/compositions');
  }

  getComposition(id: string) {
    return this.http.get<CompositionDto>(`/api/compositions/${id}`);
  }

  createComposition(request: CreateCompositionRequest) {
    return this.http.post<CompositionDto>('/api/compositions', request);
  }

  deleteComposition(id: string) {
    return this.http.delete<void>(`/api/compositions/${id}`);
  }

  voteComposition(id: string, vote: -1 | 0 | 1) {
    return this.http.post<CompositionDto>(`/api/compositions/${id}/vote`, { vote });
  }
}
