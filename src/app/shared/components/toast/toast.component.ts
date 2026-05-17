import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast--{{ t.type }}" (click)="toast.dismiss(t.id)">
          <span class="toast__icon">{{ icons[t.type] }}</span>
          <span class="toast__msg">{{ t.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 10px;
      z-index: 9999; max-width: 360px;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 18px; border-radius: 12px;
      font-size: 14px; font-weight: 500; cursor: pointer;
      animation: slideIn .25s ease; box-shadow: 0 4px 20px rgba(0,0,0,.15);
      color: #fff;
    }
    .toast--success { background: #16a34a; }
    .toast--error   { background: #dc2626; }
    .toast--warning { background: #d97706; }
    .toast--info    { background: #2563eb; }
    .toast__icon { font-size: 18px; }
    @keyframes slideIn { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:none; } }
  `],
})
export class ToastComponent {
  toast = inject(ToastService);
  icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
}
