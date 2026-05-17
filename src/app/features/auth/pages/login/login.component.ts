import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <!-- Painel esquerdo — branding -->
      <aside class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <span class="logo-icon">🍽️</span>
            <span class="logo-text">ProntoJá</span>
          </div>
          <h1 class="brand-headline">Pediu.<br>Chegou.</h1>
          <p class="brand-sub">A plataforma de delivery mais rápida de Angola. Restaurantes, pratos e entrega — tudo num só lugar.</p>
          <div class="brand-stats">
            <div class="stat"><span class="stat-n">50+</span><span class="stat-l">Restaurantes</span></div>
            <div class="stat"><span class="stat-n">30 min</span><span class="stat-l">Entrega média</span></div>
            <div class="stat"><span class="stat-n">4.8 ★</span><span class="stat-l">Avaliação</span></div>
          </div>
        </div>
        <div class="brand-bg"></div>
      </aside>

      <!-- Painel direito — formulário -->
      <main class="auth-form-panel">
        <div class="auth-form-wrap">
          <div class="form-header">
            <h2>Bem-vindo de volta</h2>
            <p>Entre na sua conta para continuar</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form" novalidate>
            <!-- Email -->
            <div class="field" [class.field--error]="hasError('email')">
              <label for="email">E-mail</label>
              <input id="email" type="email" formControlName="email"
                placeholder="o-seu@email.com" autocomplete="email">
              @if (hasError('email')) {
                <span class="err">E-mail inválido</span>
              }
            </div>

            <!-- Senha -->
            <div class="field" [class.field--error]="hasError('password')">
              <label for="password">Senha</label>
              <div class="input-eye">
                <input id="password" [type]="showPass() ? 'text' : 'password'"
                  formControlName="password" placeholder="••••••••" autocomplete="current-password">
                <button type="button" class="eye-btn" (click)="showPass.set(!showPass())">
                  {{ showPass() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (hasError('password')) {
                <span class="err">Mínimo 6 caracteres</span>
              }
            </div>

            <div class="form-actions-row">
              <a routerLink="/auth/recover" class="forgot">Esqueceu a senha?</a>
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> A entrar… }
              @else { Entrar }
            </button>
          </form>

          <p class="switch-link">
            Não tem conta? <a routerLink="/auth/register">Criar conta grátis</a>
          </p>

          <!-- Demo hint -->
          <div class="demo-hint">
            <strong>Demo:</strong> joao&#64;email.com / 123456
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; height:100vh; }

    .auth-layout {
      display:grid; grid-template-columns:1fr 1fr; height:100%;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* ---- Brand ---- */
    .auth-brand {
      position:relative; overflow:hidden;
      background: linear-gradient(135deg, #C0392B 0%, #E74C3C 40%, #E67E22 100%);
      display:flex; align-items:center; padding:48px;
    }
    .brand-bg {
      position:absolute; inset:0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .brand-content { position:relative; z-index:1; color:#fff; }
    .brand-logo { display:flex; align-items:center; gap:10px; margin-bottom:48px; }
    .logo-icon { font-size:32px; }
    .logo-text { font-size:28px; font-weight:800; letter-spacing:-1px; }
    .brand-headline { font-size:56px; font-weight:900; line-height:1.0; margin:0 0 20px; letter-spacing:-2px; }
    .brand-sub { font-size:16px; line-height:1.6; opacity:.85; max-width:340px; margin-bottom:48px; }
    .brand-stats { display:flex; gap:32px; }
    .stat { display:flex; flex-direction:column; gap:2px; }
    .stat-n { font-size:24px; font-weight:800; }
    .stat-l { font-size:12px; opacity:.75; text-transform:uppercase; letter-spacing:.5px; }

    /* ---- Form panel ---- */
    .auth-form-panel {
      display:flex; align-items:center; justify-content:center;
      padding:40px; background:#FAFAFA;
    }
    .auth-form-wrap { width:100%; max-width:400px; }
    .form-header { margin-bottom:32px; }
    .form-header h2 { font-size:28px; font-weight:800; color:#111; margin:0 0 6px; }
    .form-header p  { color:#6B7280; font-size:15px; margin:0; }

    /* Fields */
    .form { display:flex; flex-direction:column; gap:20px; }
    .field { display:flex; flex-direction:column; gap:6px; }
    .field label { font-size:13px; font-weight:600; color:#374151; }
    .field input {
      padding:13px 14px; border:2px solid #E5E7EB; border-radius:10px;
      font-size:15px; background:#fff; outline:none; transition:border .2s;
      width:100%; box-sizing:border-box;
    }
    .field input:focus { border-color:#E74C3C; }
    .field--error input { border-color:#EF4444; }
    .err { font-size:12px; color:#EF4444; }

    .input-eye { position:relative; }
    .input-eye input { padding-right:44px; }
    .eye-btn {
      position:absolute; right:12px; top:50%; transform:translateY(-50%);
      background:none; border:none; cursor:pointer; font-size:18px; padding:0;
    }

    .form-actions-row { display:flex; justify-content:flex-end; margin-top:-8px; }
    .forgot { font-size:13px; color:#E74C3C; text-decoration:none; font-weight:500; }
    .forgot:hover { text-decoration:underline; }

    /* Button */
    .btn-primary {
      padding:14px; background:linear-gradient(135deg,#C0392B,#E74C3C);
      color:#fff; border:none; border-radius:10px; font-size:16px;
      font-weight:700; cursor:pointer; transition:opacity .2s, transform .1s;
      display:flex; align-items:center; justify-content:center; gap:8px;
    }
    .btn-primary:hover:not(:disabled) { opacity:.92; transform:translateY(-1px); }
    .btn-primary:disabled { opacity:.6; cursor:not-allowed; }

    .spinner {
      width:18px; height:18px; border:2px solid rgba(255,255,255,.4);
      border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg); } }

    .switch-link { text-align:center; font-size:14px; color:#6B7280; margin-top:24px; }
    .switch-link a { color:#E74C3C; font-weight:600; text-decoration:none; }
    .switch-link a:hover { text-decoration:underline; }

    .demo-hint {
      margin-top:20px; padding:12px 16px; background:#FEF3C7;
      border-radius:8px; font-size:13px; color:#92400E; text-align:center;
    }

    @media (max-width:768px) {
      .auth-layout { grid-template-columns:1fr; }
      .auth-brand { display:none; }
    }
  `],
})
export class LoginComponent {
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  showPass = signal(false);
  loading  = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  hasError(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && c.touched;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    const { email, password } = this.form.value;

    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.toast.success('Bem-vindo ao ProntoJá! 🎉');
        this.auth.redirectByRole();
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Erro ao entrar. Tente novamente.');
        this.loading.set(false);
      },
    });
  }
}
