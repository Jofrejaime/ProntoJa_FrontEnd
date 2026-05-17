import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <div class="logo">🍽️ <span>ProntoJá</span></div>

        @if (!sent()) {
          <h2>Recuperar Senha</h2>
          <p class="sub">Insira o seu e-mail e enviaremos as instruções de recuperação.</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
            <div class="field" [class.field--error]="hasError('email')">
              <label>E-mail</label>
              <input type="email" formControlName="email" placeholder="o-seu@email.com">
              @if (hasError('email')) { <span class="err">E-mail inválido</span> }
            </div>
            <button type="submit" class="btn" [disabled]="loading()">
              @if (loading()) { A enviar… } @else { Enviar Instruções }
            </button>
          </form>
        } @else {
          <div class="success-state">
            <div class="success-icon">📧</div>
            <h2>E-mail enviado!</h2>
            <p>Verifique a sua caixa de entrada e siga as instruções para redefinir a senha.</p>
          </div>
        }

        <p class="back"><a routerLink="/auth/login">← Voltar ao login</a></p>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; min-height:100vh; }
    .page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#FAFAFA; font-family:'Segoe UI',system-ui,sans-serif; }
    .card { background:#fff; border-radius:16px; padding:48px 40px; width:100%; max-width:400px; box-shadow:0 4px 40px rgba(0,0,0,.08); }
    .logo { display:flex; align-items:center; gap:8px; font-size:20px; font-weight:800; color:#C0392B; margin-bottom:32px; }
    h2 { font-size:24px; font-weight:800; color:#111; margin:0 0 8px; }
    .sub { color:#6B7280; font-size:14px; line-height:1.6; margin:0 0 28px; }
    .form { display:flex; flex-direction:column; gap:16px; }
    .field { display:flex; flex-direction:column; gap:6px; }
    .field label { font-size:13px; font-weight:600; color:#374151; }
    .field input { padding:13px 14px; border:2px solid #E5E7EB; border-radius:10px; font-size:15px; outline:none; transition:border .2s; box-sizing:border-box; width:100%; }
    .field input:focus { border-color:#E74C3C; }
    .field--error input { border-color:#EF4444; }
    .err { font-size:12px; color:#EF4444; }
    .btn { padding:14px; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
    .success-state { text-align:center; }
    .success-icon { font-size:56px; margin-bottom:16px; }
    .back { text-align:center; margin-top:24px; font-size:14px; }
    .back a { color:#E74C3C; text-decoration:none; font-weight:500; }
  `],
})
export class RecoverComponent {
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  loading = signal(false);
  sent    = signal(false);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  hasError(f: string): boolean {
    const c = this.form.get(f)!;
    return c.invalid && c.touched;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.recoverPassword(this.form.value.email!).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); },
      error: () => { this.toast.error('Erro ao enviar. Tente novamente.'); this.loading.set(false); },
    });
  }
}
