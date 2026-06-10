import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

interface HeroDto {
  id: string;
  name: string;
  heroClass: string;
  roles: string[];
  iconUrl: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);

  protected readonly heroes = signal<HeroDto[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly brokenIconIds = signal(new Set<string>());

  constructor() {
    this.http.get<HeroDto[]>('/api/v1/heroes').subscribe({
      next: (heroes) => {
        this.heroes.set(heroes);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load heroes. Make sure Spring Boot is running on port 8081.');
        this.isLoading.set(false);
      }
    });
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
}
