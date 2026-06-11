import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SupabaseAuthService } from './supabase-auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(SupabaseAuthService);
  const token = authService.accessToken();

  if (!token) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};
