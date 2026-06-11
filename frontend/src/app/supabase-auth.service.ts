import { Injectable, computed, signal } from '@angular/core';
import { AuthChangeEvent, Session, createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

export interface AuthState {
  session: Session | null;
  isReady: boolean;
}

export interface CurrentUser {
  id: string;
  email: string | null;
  username: string | null;
  role: 'user' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  readonly client = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey || environment.supabaseAnonKey
  );

  private readonly state = signal<AuthState>({
    session: null,
    isReady: false
  });
  private readonly profile = signal<CurrentUser | null>(null);

  readonly session = computed(() => this.state().session);
  readonly isReady = computed(() => this.state().isReady);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly userId = computed(() => this.session()?.user.id ?? '');
  readonly email = computed(() => this.session()?.user.email ?? '');
  readonly username = computed(() => this.profile()?.username ?? this.metadataUsername());
  readonly displayName = computed(() => {
    const username = this.username();

    if (username) {
      return username;
    }

    const session = this.session();

    if (!session) {
      return '';
    }

    return session.user.email?.split('@')[0] ?? '';
  });

  constructor() {
    void this.loadSession();

    this.client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      this.state.set({ session, isReady: true });
      void this.loadProfile(session);
    });
  }

  async signUp(email: string, password: string, username: string) {
    return this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim()
        }
      }
    });
  }

  async signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async signInWithGoogle() {
    return this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  }

  async signOut() {
    await this.client.auth.signOut();
    this.state.set({ session: null, isReady: true });
    this.profile.set(null);
  }

  accessToken(): string | null {
    return this.session()?.access_token ?? null;
  }

  private async loadSession(): Promise<void> {
    const { data } = await this.client.auth.getSession();
    this.state.set({ session: data.session, isReady: true });
    await this.loadProfile(data.session);
  }

  private metadataUsername(): string {
    const metadataUsername = this.session()?.user.user_metadata?.['username'];
    return typeof metadataUsername === 'string' ? metadataUsername.trim() : '';
  }

  private async loadProfile(session: Session | null): Promise<void> {
    if (!session) {
      this.profile.set(null);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        return;
      }

      this.profile.set(await response.json() as CurrentUser);
    } catch {
      // The app can still use Supabase session metadata if the backend is offline.
    }
  }
}
