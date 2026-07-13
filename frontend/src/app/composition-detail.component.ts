import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompositionApiService, CompositionDto } from './composition-api.service';
import { SeoService } from './seo.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { ThemeToggleComponent } from './theme-toggle.component';

@Component({
  selector: 'app-composition-detail',
  imports: [DatePipe, RouterLink, ThemeToggleComponent],
  templateUrl: './composition-detail.component.html'
})
export class CompositionDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CompositionApiService);
  private readonly seo = inject(SeoService);
  protected readonly authService = inject(SupabaseAuthService);
  private readonly compositionId = this.route.snapshot.paramMap.get('compositionId') ?? '';

  protected readonly composition = signal<CompositionDto | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isDeleting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly authMessage = signal('');
  protected readonly brokenIconIds = signal(new Set<string>());

  constructor() {
    this.loadComposition();
  }

  protected vote(vote: -1 | 1): void {
    const composition = this.composition();
    if (!composition) return;
    if (!this.authService.isAuthenticated()) {
      this.authMessage.set('Login to vote on compositions.');
      return;
    }
    const nextVote = composition.currentUserVote === vote ? 0 : vote;
    this.api.voteComposition(composition.id, nextVote).subscribe({
      next: (updated) => {
        this.composition.set(updated);
        this.authMessage.set('');
      },
      error: (error) => this.authMessage.set(error?.error?.message ?? 'Could not save your vote.')
    });
  }

  protected deleteComposition(): void {
    const composition = this.composition();
    if (!composition?.ownedByCurrentUser || this.isDeleting()) return;
    if (!window.confirm(`Delete “${composition.name}”? This cannot be undone.`)) return;
    this.isDeleting.set(true);
    this.api.deleteComposition(composition.id).subscribe({
      next: () => void this.router.navigate(['/compositions']),
      error: (error) => {
        this.isDeleting.set(false);
        this.authMessage.set(error?.error?.message ?? 'Could not delete this composition.');
      }
    });
  }

  protected signOut(): void {
    void this.authService.signOut();
  }

  protected markImageBroken(id: string): void {
    this.brokenIconIds.update((ids) => new Set(ids).add(id));
  }

  protected isImageBroken(id: string): boolean {
    return this.brokenIconIds().has(id);
  }

  protected initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  private loadComposition(): void {
    this.api.getComposition(this.compositionId).subscribe({
      next: (composition) => {
        this.composition.set(composition);
        this.seo.setPage({
          title: composition.name,
          description: composition.notes || `View the heroes in ${composition.name}, created by ${composition.authorName}.`,
          path: `/compositions/${composition.id}`,
          image: composition.heroes[0]?.iconUrl
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.status === 404 ? 'Composition not found.' : 'Could not load this composition.');
        this.seo.setPage({
          title: 'Composition Not Found',
          description: 'The requested DalaranSiege composition could not be found.',
          path: `/compositions/${this.compositionId}`,
          noIndex: true
        });
        this.isLoading.set(false);
      }
    });
  }
}
