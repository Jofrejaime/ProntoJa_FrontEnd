import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UserRole } from '../../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <aside class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <span class="logo-icon">🍽️</span>
            <span class="logo-text">ProntoJá</span>
          </div>
          <h1 class="brand-headline">Junte-se<br>à família.</h1>
          <p class="brand-sub">Crie a sua conta grátis e comece a pedir a melhor comida de Luanda em minutos.</p>
        </div>
        <div class="brand-bg"></div>
      </aside>

      <main class="auth-form-panel">
        <div class="auth-form-wrap">
          <div class="form-header">
            <h2>Criar Conta</h2>
            <p>Preencha os seus dados para começar</p>
          </div>

          <!-- Role selector -->
          <div class="role-selector">
            @for (r of roles; track r.value) {
              <button type="button" class="role-btn" [class.active]="selectedRole() === r.value"
                (click)="selectedRole.set(r.value)">
                <span>{{ r.icon }}</span>
                <span>{{ r.label }}</span>
              </button>
            }
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form" novalidate>
            <div class="field" [class.field--error]="hasError('name')">
              <label>Nome completo</label>
              <input type="text" formControlName="name" placeholder="João Mulemba">
              @if (hasError('name')) { <span class="err">Nome obrigatório</span> }
            </div>

            <div class="field" [class.field--error]="hasError('email')">
              <label>E-mail</label>
              <input type="email" formControlName="email" placeholder="o-seu@email.com">
              @if (hasError('email')) { <span class="err">E-mail inválido</span> }
            </div>

            <div class="field" [class.field--error]="hasError('phone')">
              <label>Telefone</label>
              <input type="tel" formControlName="phone" placeholder="+244 9XX XXX XXX">
              @if (hasError('phone')) { <span class="err">Telefone obrigatório</span> }
            </div>

            <div class="field" [class.field--error]="hasError('password')">
              <label>Senha</label>
              <input type="password" formControlName="password" placeholder="Mínimo 6 caracteres">
              @if (hasError('password')) { <span class="err">Mínimo 6 caracteres</span> }
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> A criar conta… }
              @else { Criar Conta Grátis }
            </button>
          </form>

          <p class="switch-link">
            Já tem conta? <a routerLink="/auth/login">Entrar</a>
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; height:100vh; }
    .auth-layout { display:grid; grid-template-columns:1fr 1fr; height:100%; font-family:'Segoe UI',system-ui,sans-serif; }
    .auth-brand { position:relative; overflow:hidden; background:linear-gradient(135deg,#C0392B,#E74C3C 40%,#E67E22 100%); display:flex; align-items:center; padding:48px; }
    .brand-bg { position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
    .brand-content { position:relative; z-index:1; color:#fff; }
    .brand-logo { display:flex; align-items:center; gap:10px; margin-bottom:48px; }
    .logo-icon { font-size:32px; }
    .logo-text { font-size:28px; font-weight:800; letter-spacing:-1px; }
    .brand-headline { font-size:52px; font-weight:900; line-height:1.0; margin:0 0 20px; letter-spacing:-2px; }
    .brand-sub { font-size:16px; line-height:1.6; opacity:.85; max-width:340px; }
    .auth-form-panel { display:flex; align-items:center; justify-content:center; padding:40px; background:#FAFAFA; overflow-y:auto; }
    .auth-form-wrap { width:100%; max-width:420px; }
    .form-header { margin-bottom:24px; }
    .form-header h2 { font-size:26px; font-weight:800; color:#111; margin:0 0 4px; }
    .form-header p  { color:#6B7280; font-size:14px; margin:0; }
    .role-selector { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:24px; }
    .role-btn { padding:12px 8px; border:2px solid #E5E7EB; border-radius:10px; background:#fff; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px; font-size:13px; font-weight:600; color:#374151; transition:all .2s; }
    .role-btn span:first-child { font-size:22px; }
    .role-btn.active { border-color:#E74C3C; background:#FEF2F2; color:#C0392B; }
    .form { display:flex; flex-direction:column; gap:16px; }
    .field { display:flex; flex-direction:column; gap:6px; }
    .field label { font-size:13px; font-weight:600; color:#374151; }
    .field input { padding:13px 14px; border:2px solid #E5E7EB; border-radius:10px; font-size:15px; background:#fff; outline:none; transition:border .2s; width:100%; box-sizing:border-box; }
    .field input:focus { border-color:#E74C3C; }
    .field--error input { border-color:#EF4444; }
    .err { font-size:12px; color:#EF4444; }
    .btn-primary { padding:14px; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:opacity .2s; }
    .btn-primary:hover:not(:disabled) { opacity:.92; }
    .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
    .spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .switch-link { text-align:center; font-size:14px; color:#6B7280; margin-top:20px; }
    .switch-link a { color:#E74C3C; font-weight:600; text-decoration:none; }
    @media (max-width:768px) { .auth-layout { grid-template-columns:1fr; } .auth-brand { display:none; } }
  `],
})
export class RegisterComponent {
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  loading      = signal(false);
  selectedRole = signal<UserRole>('client');

  roles = [
    { value: 'client'     as UserRole, icon: '🛒', label: 'Cliente'      },
    { value: 'restaurant' as UserRole, icon: '🍴', label: 'Restaurante'  },
    { value: 'delivery'   as UserRole, icon: '🛵', label: 'Entregador'   },
  ];

  form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    phone:    ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  hasError(f: string): boolean {
    const c = this.form.get(f)!;
    return c.invalid && c.touched;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    const v = this.form.value;
    this.auth.register({ name: v.name!, email: v.email!, phone: v.phone!, password: v.password!, role: this.selectedRole() }).subscribe({
      next: () => { this.toast.success('Conta criada com sucesso! Bem-vindo 🎉'); this.auth.redirectByRole(); },
      error: () => { this.toast.error('Erro ao criar conta.'); this.loading.set(false); },
    });
  }
}
