import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  success(message: string): void { this.push(message, 'success'); }
  error(message: string): void { this.push(message, 'error'); }
  warning(message: string): void { this.push(message, 'warning'); }
  info(message: string): void { this.push(message, 'info'); }

  dismiss(id: number): void {
    this.toasts.update((items) => items.filter((toast) => toast.id !== id));
  }

  private push(message: string, type: ToastType): void {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    this.toasts.update((items) => [...items, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 3500);
  }
}
