import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { MOCK_USERS } from './mock-data';
import { User, UserRole } from '../models';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  readonly currentUser = signal<User | null>(MOCK_USERS[0]);

  login(payload: LoginPayload): Observable<User> {
    const user = MOCK_USERS.find((item) => item.email.toLowerCase() === payload.email.toLowerCase())
      ?? this.demoUserFor(payload.email);

    if (!payload.password || payload.password.length < 6) {
      return throwError(() => ({ message: 'Credenciais inválidas.' }));
    }

    return of(user).pipe(
      delay(400),
      tap((loggedUser) => this.currentUser.set(loggedUser)),
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    const user: User = {
      id: Date.now(),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      status: 'active',
      restaurantId: payload.role === 'restaurant' ? 1 : undefined,
    };

    return of(user).pipe(
      delay(500),
      tap((createdUser) => this.currentUser.set(createdUser)),
    );
  }

  recoverPassword(email: string): Observable<{ ok: true }> {
    return of({ ok: true as const }).pipe(delay(email ? 500 : 0));
  }

  logout(): void {
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  redirectByRole(): void {
    const role = this.currentUser()?.role;
    const target = role === 'restaurant'
      ? '/restaurante/dashboard'
      : role === 'delivery'
        ? '/entregador/dashboard'
        : role === 'admin'
          ? '/admin/dashboard'
          : '/cliente/inicio';

    this.router.navigate([target]);
  }

  private demoUserFor(email: string): User {
    if (email.includes('rest')) return MOCK_USERS[1];
    if (email.includes('entreg')) return MOCK_USERS[2];
    if (email.includes('admin')) return MOCK_USERS[3];
    return MOCK_USERS[0];
  }
}
