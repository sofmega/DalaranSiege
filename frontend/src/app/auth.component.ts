import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseAuthService } from './supabase-auth.service';
import { ThemeToggleComponent } from './theme-toggle.component';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink, ThemeToggleComponent],
  templateUrl: './auth.component.html'
})
export class AuthComponent {
  protected readonly authService = inject(SupabaseAuthService);
  private readonly router = inject(Router);

  protected readonly mode = signal<AuthMode>('login');
  protected readonly username = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly message = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isSubmitting = signal(false);

  protected showLogin(): void {
    this.mode.set('login');
    this.clearMessages();
  }

  protected showRegister(): void {
    this.mode.set('register');
    this.clearMessages();
  }

  protected updateEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected updateUsername(event: Event): void {
    this.username.set((event.target as HTMLInputElement).value);
  }

  protected updatePassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected async submit(): Promise<void> {
    this.clearMessages();
    this.isSubmitting.set(true);

    try {
      if (this.mode() === 'register' && this.username().trim().length < 3) {
        this.errorMessage.set('Username must be at least 3 characters.');
        return;
      }

      const result = this.mode() === 'login'
        ? await this.authService.signIn(this.email(), this.password())
        : await this.authService.signUp(this.email(), this.password(), this.username());

      if (result.error) {
        this.errorMessage.set(result.error.message);
        return;
      }

      if (this.mode() === 'register' && !result.data.session) {
        this.message.set('Check your email to confirm your account, then log in.');
        return;
      }

      await this.router.navigateByUrl('/');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected async signInWithGoogle(): Promise<void> {
    this.clearMessages();
    this.isSubmitting.set(true);

    try {
      const result = await this.authService.signInWithGoogle();

      if (result.error) {
        this.errorMessage.set(result.error.message);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected signOut(): void {
    void this.authService.signOut();
  }

  private clearMessages(): void {
    this.message.set('');
    this.errorMessage.set('');
  }
}
