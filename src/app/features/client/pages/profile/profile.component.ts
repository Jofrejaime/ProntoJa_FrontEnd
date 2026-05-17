import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar />

    <div class="page">
      <h1 class="page-title">O Meu Perfil</h1>

      <div class="profile-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="avatar-card">
            <div class="avatar-big">{{ initial() }}</div>
            <h3>{{ auth.currentUser()?.name }}</h3>
            <p>{{ auth.currentUser()?.email }}</p>
            <span class="role-badge">{{ roleLabel() }}</span>
          </div>
          <nav class="side-nav">
            @for (item of navItems; track item.id) {
              <button class="side-nav-item" [class.active]="activeSection === item.id"
                (click)="activeSection = item.id">
                <span>{{ item.icon }}</span> {{ item.label }}
              </button>
            }
            <button class="side-nav-item logout" (click)="logout()">
              <span>🚪</span> Sair da conta
            </button>
          </nav>
        </aside>

        <!-- Main content -->
        <main class="main-content">

          <!-- Personal data -->
          @if (activeSection === 'personal') {
            <div class="content-card">
              <h2 class="content-title">Dados Pessoais</h2>
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="form">
                <div class="form-row">
                  <div class="field">
                    <label>Nome completo</label>
                    <input type="text" formControlName="name">
                  </div>
                  <div class="field">
                    <label>Telefone</label>
                    <input type="tel" formControlName="phone">
                  </div>
                </div>
                <div class="field">
                  <label>E-mail</label>
                  <input type="email" formControlName="email">
                </div>
                <button type="submit" class="btn-save" [disabled]="saving()">
                  @if (saving()) { A guardar… } @else { Guardar alterações }
                </button>
              </form>
            </div>
          }

          <!-- Password -->
          @if (activeSection === 'password') {
            <div class="content-card">
              <h2 class="content-title">Alterar Senha</h2>
              <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="form">
                <div class="field">
                  <label>Senha actual</label>
                  <input type="password" formControlName="currentPassword" placeholder="••••••••">
                </div>
                <div class="field">
                  <label>Nova senha</label>
                  <input type="password" formControlName="newPassword" placeholder="Mínimo 6 caracteres">
                </div>
                <div class="field">
                  <label>Confirmar nova senha</label>
                  <input type="password" formControlName="confirmPassword" placeholder="Repita a nova senha">
                  @if (passwordForm.errors?.['mismatch'] && passwordForm.touched) {
                    <span class="err">As senhas não coincidem</span>
                  }
                </div>
                <button type="submit" class="btn-save" [disabled]="saving()">
                  @if (saving()) { A guardar… } @else { Actualizar Senha }
                </button>
              </form>
            </div>
          }

          <!-- Addresses -->
          @if (activeSection === 'addresses') {
            <div class="content-card">
              <h2 class="content-title">Endereços Guardados</h2>
              <div class="addresses-list">
                @for (addr of addresses(); track addr.id) {
                  <div class="addr-item">
                    <div class="addr-icon">{{ addr.icon }}</div>
                    <div class="addr-info">
                      <strong>{{ addr.label }}</strong>
                      <span>{{ addr.address }}</span>
                    </div>
                    <div class="addr-actions">
                      <button class="icon-btn" (click)="editAddress(addr)">✏️</button>
                      <button class="icon-btn danger" (click)="removeAddress(addr.id)">🗑️</button>
                    </div>
                  </div>
                }
              </div>
              @if (addingAddress()) {
                <div class="add-addr-form">
                  <input type="text" [(ngModel)]="newAddrLabel" placeholder="Nome (ex: Casa, Trabalho)" class="input">
                  <input type="text" [(ngModel)]="newAddrValue" placeholder="Endereço completo" class="input">
                  <div class="add-addr-actions">
                    <button class="btn-cancel" (click)="addingAddress.set(false)">Cancelar</button>
                    <button class="btn-save-addr" (click)="saveAddress()">Guardar</button>
                  </div>
                </div>
              } @else {
                <button class="btn-add-addr" (click)="addingAddress.set(true)">+ Adicionar endereço</button>
              }
            </div>
          }

          <!-- Notifications -->
          @if (activeSection === 'notifications') {
            <div class="content-card">
              <h2 class="content-title">Notificações</h2>
              <div class="notif-list">
                @for (notif of notifSettings; track notif.id) {
                  <div class="notif-item">
                    <div>
                      <strong>{{ notif.label }}</strong>
                      <p>{{ notif.description }}</p>
                    </div>
                    <button class="toggle-btn" [class.on]="notif.enabled"
                      (click)="notif.enabled = !notif.enabled">
                      <span class="toggle-knob"></span>
                    </button>
                  </div>
                }
              </div>
              <button class="btn-save" (click)="saveNotifications()">Guardar preferências</button>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F9FAFB; min-height:100vh; }
    .page { max-width:1100px; margin:0 auto; padding:32px 24px 64px; }
    .page-title { font-size:28px; font-weight:800; color:#111; margin:0 0 28px; }

    .profile-layout { display:grid; grid-template-columns:260px 1fr; gap:28px; align-items:start; }

    /* Sidebar */
    .sidebar { display:flex; flex-direction:column; gap:16px; }
    .avatar-card { background:#fff; border-radius:16px; padding:24px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,.06); }
    .avatar-big { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; font-size:32px; font-weight:700; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .avatar-card h3 { font-size:16px; font-weight:700; color:#111; margin:0 0 4px; }
    .avatar-card p  { font-size:13px; color:#6B7280; margin:0 0 12px; }
    .role-badge { display:inline-block; background:#FEF2F2; color:#C0392B; font-size:12px; font-weight:600; padding:4px 12px; border-radius:20px; }

    .side-nav { background:#fff; border-radius:16px; padding:12px; box-shadow:0 2px 12px rgba(0,0,0,.06); display:flex; flex-direction:column; gap:4px; }
    .side-nav-item { display:flex; align-items:center; gap:10px; padding:11px 14px; border:none; border-radius:10px; background:transparent; font-size:14px; font-weight:500; color:#374151; cursor:pointer; text-align:left; transition:all .2s; }
    .side-nav-item:hover { background:#F9FAFB; }
    .side-nav-item.active { background:#FEF2F2; color:#C0392B; font-weight:600; }
    .side-nav-item.logout { color:#EF4444; margin-top:8px; border-top:1px solid #F3F4F6; padding-top:12px; }
    .side-nav-item.logout:hover { background:#FEF2F2; }

    /* Main */
    .content-card { background:#fff; border-radius:16px; padding:32px; box-shadow:0 2px 12px rgba(0,0,0,.06); }
    .content-title { font-size:20px; font-weight:800; color:#111; margin:0 0 28px; }

    /* Form */
    .form { display:flex; flex-direction:column; gap:18px; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
    .field { display:flex; flex-direction:column; gap:6px; }
    .field label { font-size:13px; font-weight:600; color:#374151; }
    .field input { padding:13px 14px; border:2px solid #E5E7EB; border-radius:10px; font-size:15px; outline:none; transition:border .2s; box-sizing:border-box; }
    .field input:focus { border-color:#E74C3C; }
    .err { font-size:12px; color:#EF4444; }
    .btn-save { padding:13px 24px; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; width:fit-content; transition:opacity .2s; }
    .btn-save:hover:not(:disabled) { opacity:.9; }
    .btn-save:disabled { opacity:.6; cursor:not-allowed; }

    /* Addresses */
    .addresses-list { display:flex; flex-direction:column; gap:10px; margin-bottom:16px; }
    .addr-item { display:flex; align-items:center; gap:14px; padding:14px; background:#F9FAFB; border-radius:12px; }
    .addr-icon { font-size:24px; }
    .addr-info { flex:1; display:flex; flex-direction:column; gap:2px; }
    .addr-info strong { font-size:14px; font-weight:600; color:#111; }
    .addr-info span   { font-size:13px; color:#6B7280; }
    .addr-actions { display:flex; gap:8px; }
    .icon-btn { background:none; border:none; font-size:18px; cursor:pointer; opacity:.6; transition:opacity .2s; }
    .icon-btn:hover { opacity:1; }
    .icon-btn.danger:hover { opacity:1; }
    .add-addr-form { display:flex; flex-direction:column; gap:10px; padding:16px; border:2px dashed #E5E7EB; border-radius:12px; }
    .input { border:2px solid #E5E7EB; border-radius:10px; padding:11px 14px; font-size:14px; outline:none; transition:border .2s; }
    .input:focus { border-color:#E74C3C; }
    .add-addr-actions { display:flex; gap:10px; }
    .btn-cancel { padding:10px 16px; background:#F3F4F6; border:none; border-radius:8px; font-size:14px; cursor:pointer; }
    .btn-save-addr { padding:10px 16px; background:#E74C3C; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .btn-add-addr { padding:11px 18px; border:2px dashed #E5E7EB; background:transparent; border-radius:10px; font-size:14px; color:#6B7280; cursor:pointer; width:100%; transition:all .2s; }
    .btn-add-addr:hover { border-color:#E74C3C; color:#E74C3C; background:#FEF2F2; }

    /* Notifications */
    .notif-list { display:flex; flex-direction:column; gap:0; margin-bottom:24px; }
    .notif-item { display:flex; align-items:center; justify-content:space-between; padding:18px 0; border-bottom:1px solid #F3F4F6; gap:16px; }
    .notif-item strong { font-size:14px; font-weight:600; color:#111; display:block; margin-bottom:2px; }
    .notif-item p { font-size:13px; color:#6B7280; margin:0; }
    .toggle-btn { position:relative; width:44px; height:24px; border-radius:12px; border:none; background:#E5E7EB; cursor:pointer; transition:background .3s; flex-shrink:0; }
    .toggle-btn.on { background:#E74C3C; }
    .toggle-knob { position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:transform .3s; box-shadow:0 1px 4px rgba(0,0,0,.2); display:block; }
    .toggle-btn.on .toggle-knob { transform:translateX(20px); }

    @media(max-width:768px) {
      .profile-layout { grid-template-columns:1fr; }
      .form-row { grid-template-columns:1fr; }
    }
  `],
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fb    = inject(FormBuilder);

  saving       = signal(false);
  addingAddress = signal(false);
  activeSection = 'personal';
  newAddrLabel  = '';
  newAddrValue  = '';

  navItems = [
    { id: 'personal',      icon: '👤', label: 'Dados Pessoais' },
    { id: 'password',      icon: '🔒', label: 'Senha' },
    { id: 'addresses',     icon: '📍', label: 'Endereços' },
    { id: 'notifications', icon: '🔔', label: 'Notificações' },
  ];

  profileForm = this.fb.group({
    name:  [this.auth.currentUser()?.name ?? '', Validators.required],
    email: [this.auth.currentUser()?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.auth.currentUser()?.phone ?? ''],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  addresses = signal([
    { id: 1, icon: '🏠', label: 'Casa',      address: 'Rua Comandante Gika, Luanda' },
    { id: 2, icon: '🏢', label: 'Trabalho',  address: 'Av. 4 de Fevereiro, Luanda' },
  ]);

  notifSettings = [
    { id: 'order_update', label: 'Actualizações de pedido', description: 'Receba notificações quando o seu pedido mudar de estado.', enabled: true  },
    { id: 'promotions',   label: 'Promoções e ofertas',     description: 'Descubra descontos e novidades dos restaurantes.',        enabled: true  },
    { id: 'delivery',     label: 'Entregador a caminho',    description: 'Seja notificado quando o entregador estiver próximo.',    enabled: true  },
    { id: 'newsletter',   label: 'Newsletter semanal',      description: 'Resumo das novidades e restaurantes em destaque.',        enabled: false },
  ];

  initial(): string { return (this.auth.currentUser()?.name?.[0] ?? 'U').toUpperCase(); }

  roleLabel(): string {
    const map: Record<string, string> = { client: 'Cliente', restaurant: 'Restaurante', delivery: 'Entregador', admin: 'Admin' };
    return map[this.auth.currentUser()?.role ?? 'client'];
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    setTimeout(() => { this.saving.set(false); this.toast.success('Perfil actualizado com sucesso!'); }, 800);
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;
    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.passwordForm.setErrors({ mismatch: true });
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    setTimeout(() => { this.saving.set(false); this.toast.success('Senha alterada com sucesso!'); this.passwordForm.reset(); }, 800);
  }

  saveAddress(): void {
    if (!this.newAddrLabel || !this.newAddrValue) return;
    this.addresses.update(list => [...list, { id: Date.now(), icon: '📍', label: this.newAddrLabel, address: this.newAddrValue }]);
    this.newAddrLabel = '';
    this.newAddrValue = '';
    this.addingAddress.set(false);
    this.toast.success('Endereço adicionado!');
  }

  editAddress(addr: any): void { this.toast.info('Funcionalidade em breve.'); }

  removeAddress(id: number): void {
    this.addresses.update(list => list.filter(a => a.id !== id));
    this.toast.success('Endereço removido.');
  }

  saveNotifications(): void { this.toast.success('Preferências guardadas!'); }

  logout(): void { this.auth.logout(); this.router.navigate(['/auth/login']); }
}
