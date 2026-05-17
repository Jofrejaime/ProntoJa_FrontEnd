import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KzPipe } from '../../../../shared/pipes/kz.pipe';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule, KzPipe],
  template: `
    <div class="app-wrap">
      <!-- Top bar -->
      <header class="topbar">
        <div class="tb-left">
          <span class="brand">🛵 ProntoJá</span>
          <span class="role-label">Entregador</span>
        </div>
        <div class="tb-right">
          <button class="online-toggle" [class.online]="isOnline()" (click)="toggleOnline()">
            <span class="dot"></span>
            {{ isOnline() ? 'Online' : 'Offline' }}
          </button>
          <div class="avatar">{{ initial() }}</div>
        </div>
      </header>

      <div class="main-area">
        <!-- Tabs -->
        <div class="tabs">
          <button class="tab" [class.active]="activeTab === 'available'" (click)="activeTab = 'available'">
            Disponíveis <span class="count">{{ availableDeliveries().length }}</span>
          </button>
          <button class="tab" [class.active]="activeTab === 'active'"    (click)="activeTab = 'active'">
            Activa
            @if (activeDelivery()) { <span class="count on">1</span> }
          </button>
          <button class="tab" [class.active]="activeTab === 'earnings'"  (click)="activeTab = 'earnings'">
            Ganhos
          </button>
        </div>

        <!-- Available deliveries -->
        @if (activeTab === 'available') {
          @if (!isOnline()) {
            <div class="offline-msg">
              <span>😴</span>
              <h3>Está offline</h3>
              <p>Active o modo online para receber pedidos de entrega.</p>
              <button class="btn-go-online" (click)="toggleOnline()">Ir Online</button>
            </div>
          } @else if (availableDeliveries().length === 0) {
            <div class="offline-msg">
              <span>⏳</span>
              <h3>À espera de pedidos</h3>
              <p>Quando um pedido estiver disponível, aparecerá aqui.</p>
            </div>
          } @else {
            <div class="deliveries-list">
              @for (d of availableDeliveries(); track d.id) {
                <div class="delivery-card">
                  <div class="dc-header">
                    <div class="dc-id">#{{ d.id }}</div>
                    <div class="dc-earnings">🤑 {{ d.earnings | kz }}</div>
                    <div class="dc-distance">📍 {{ d.distance }} km</div>
                  </div>

                  <div class="dc-route">
                    <div class="route-point pickup">
                      <div class="rp-dot"></div>
                      <div>
                        <p class="rp-label">Recolha</p>
                        <strong>{{ d.restaurantName }}</strong>
                        <p class="rp-addr">{{ d.restaurantAddress }}</p>
                      </div>
                    </div>
                    <div class="route-line"></div>
                    <div class="route-point dropoff">
                      <div class="rp-dot"></div>
                      <div>
                        <p class="rp-label">Entrega</p>
                        <strong>{{ d.customerName }}</strong>
                        <p class="rp-addr">{{ d.deliveryAddress }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="dc-items">
                    <span class="items-count">🛍️ {{ d.itemCount }} iten{{ d.itemCount !== 1 ? 's' : '' }}</span>
                    <span class="est-time">⏱️ ~{{ d.estimatedMinutes }} min</span>
                    <span class="order-total">{{ d.orderTotal | kz }}</span>
                  </div>

                  <div class="dc-actions">
                    <button class="btn-decline" (click)="declineDelivery(d.id)">Recusar</button>
                    <button class="btn-accept"  (click)="acceptDelivery(d)">✓ Aceitar entrega</button>
                  </div>
                </div>
              }
            </div>
          }
        }

        <!-- Active delivery -->
        @if (activeTab === 'active') {
          @if (!activeDelivery()) {
            <div class="offline-msg">
              <span>🛵</span>
              <h3>Nenhuma entrega activa</h3>
              <p>Aceite uma entrega disponível para começar.</p>
            </div>
          } @else {
            <div class="active-delivery">
              <div class="ad-header">
                <h2>Entrega #{{ activeDelivery()!.id }}</h2>
                <span class="ad-status">{{ deliveryStatusLabel(activeDelivery()!.deliveryStatus) }}</span>
              </div>

              <!-- Progress steps -->
              <div class="progress-steps">
                @for (step of deliverySteps; track step.status; let i = $index) {
                  <div class="ps-step" [class.done]="stepDone(activeDelivery()!.deliveryStatus, step.status)"
                    [class.current]="activeDelivery()!.deliveryStatus === step.status">
                    <div class="ps-dot">{{ step.icon }}</div>
                    <span>{{ step.label }}</span>
                    @if (i < deliverySteps.length - 1) { <div class="ps-line"></div> }
                  </div>
                }
              </div>

              <!-- Info card -->
              <div class="ad-info-grid">
                <div class="ad-info-card">
                  <h4>🏪 Recolha</h4>
                  <strong>{{ activeDelivery()!.restaurantName }}</strong>
                  <p>{{ activeDelivery()!.restaurantAddress }}</p>
                  <a [href]="'https://maps.google.com/?q=' + activeDelivery()!.restaurantAddress" target="_blank" class="nav-link">Navegar →</a>
                </div>
                <div class="ad-info-card">
                  <h4>🏠 Entrega</h4>
                  <strong>{{ activeDelivery()!.customerName }}</strong>
                  <p>{{ activeDelivery()!.deliveryAddress }}</p>
                  <a [href]="'tel:' + activeDelivery()!.customerPhone" class="nav-link">Ligar →</a>
                </div>
              </div>

              <!-- Items -->
              <div class="ad-items">
                @for (item of activeDelivery()!.items; track item.productId) {
                  <span class="ad-item-tag">{{ item.quantity }}× {{ item.productName }}</span>
                }
              </div>

              <div class="ad-earnings-row">
                <span>💰 Os seus ganhos nesta entrega:</span>
                <strong>{{ activeDelivery()!.earnings | kz }}</strong>
              </div>

              <button class="btn-advance"
                [disabled]="activeDelivery()!.deliveryStatus === 'delivered'"
                (click)="advanceDelivery()">
                {{ nextDeliveryLabel() }}
              </button>
            </div>
          }
        }

        <!-- Earnings -->
        @if (activeTab === 'earnings') {
          <div class="earnings-section">
            <!-- Stats -->
            <div class="earn-stats">
              @for (s of earnStats; track s.label) {
                <div class="earn-stat">
                  <span class="es-icon">{{ s.icon }}</span>
                  <p class="es-label">{{ s.label }}</p>
                  <h3 class="es-value">{{ s.value }}</h3>
                </div>
              }
            </div>

            <!-- History -->
            <h3 class="earn-hist-title">Histórico de Entregas</h3>
            <div class="earn-hist">
              @for (e of earningsHistory; track e.id) {
                <div class="earn-row">
                  <div class="er-icon">🛵</div>
                  <div class="er-info">
                    <strong>#{{ e.id }} — {{ e.restaurant }}</strong>
                    <span>{{ e.date }}</span>
                  </div>
                  <div class="er-earn">+ {{ e.earned | kz }}</div>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Bottom nav (mobile style) -->
      <nav class="bottom-nav">
        <button class="bn-item" [class.active]="activeTab === 'available'" (click)="activeTab = 'available'">
          <span>📦</span><span>Pedidos</span>
        </button>
        <button class="bn-item" [class.active]="activeTab === 'active'" (click)="activeTab = 'active'">
          <span>🛵</span><span>Activa</span>
        </button>
        <button class="bn-item" [class.active]="activeTab === 'earnings'" (click)="activeTab = 'earnings'">
          <span>💰</span><span>Ganhos</span>
        </button>
        <button class="bn-item" (click)="logout()">
          <span>🚪</span><span>Sair</span>
        </button>
      </nav>
    </div>
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F1F5F9; min-height:100vh; }
    .app-wrap { max-width:600px; margin:0 auto; min-height:100vh; background:#F1F5F9; display:flex; flex-direction:column; }

    /* Topbar */
    .topbar { background:#fff; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; position:sticky; top:0; z-index:10; }
    .tb-left { display:flex; align-items:center; gap:10px; }
    .brand { font-size:18px; font-weight:800; color:#C0392B; }
    .role-label { font-size:12px; color:#9CA3AF; background:#F3F4F6; padding:3px 10px; border-radius:20px; }
    .tb-right { display:flex; align-items:center; gap:12px; }
    .online-toggle { display:flex; align-items:center; gap:6px; padding:7px 14px; border:2px solid #E5E7EB; border-radius:20px; background:#fff; font-size:13px; font-weight:600; cursor:pointer; color:#9CA3AF; transition:all .3s; }
    .online-toggle.online { border-color:#16A34A; color:#16A34A; background:#D1FAE5; }
    .dot { width:8px; height:8px; border-radius:50%; background:#9CA3AF; }
    .online-toggle.online .dot { background:#16A34A; }
    .avatar { width:36px; height:36px; border-radius:50%; background:#E74C3C; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; }

    /* Main */
    .main-area { flex:1; padding:20px; padding-bottom:80px; }

    /* Tabs */
    .tabs { display:flex; gap:4px; margin-bottom:20px; background:#fff; border-radius:12px; padding:4px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
    .tab { flex:1; padding:10px; border:none; border-radius:10px; background:transparent; font-size:13px; font-weight:500; color:#6B7280; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all .2s; }
    .tab.active { background:#E74C3C; color:#fff; font-weight:700; }
    .count { background:rgba(255,255,255,.3); padding:1px 6px; border-radius:10px; font-size:11px; font-weight:700; }
    .tab:not(.active) .count { background:#F3F4F6; color:#6B7280; }
    .count.on { background:#16A34A; }

    /* Offline / empty */
    .offline-msg { text-align:center; padding:60px 20px; }
    .offline-msg span { font-size:48px; display:block; margin-bottom:12px; }
    .offline-msg h3 { font-size:20px; font-weight:700; color:#111; margin:0 0 8px; }
    .offline-msg p  { color:#9CA3AF; font-size:14px; margin:0 0 20px; }
    .btn-go-online { padding:12px 24px; background:#16A34A; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; }

    /* Delivery cards */
    .deliveries-list { display:flex; flex-direction:column; gap:14px; }
    .delivery-card { background:#fff; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .dc-header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
    .dc-id { font-size:14px; font-weight:700; color:#9CA3AF; flex:1; }
    .dc-earnings { font-size:16px; font-weight:800; color:#16A34A; }
    .dc-distance { font-size:13px; color:#6B7280; }

    .dc-route { display:flex; flex-direction:column; gap:0; margin-bottom:14px; }
    .route-point { display:flex; align-items:flex-start; gap:12px; }
    .rp-dot { width:12px; height:12px; border-radius:50%; margin-top:4px; flex-shrink:0; }
    .pickup .rp-dot   { background:#3B82F6; }
    .dropoff .rp-dot  { background:#E74C3C; }
    .route-line { width:2px; height:20px; background:#E5E7EB; margin:4px 0 4px 5px; }
    .rp-label { font-size:11px; color:#9CA3AF; text-transform:uppercase; letter-spacing:.3px; margin:0 0 2px; }
    .route-point strong { font-size:14px; font-weight:600; color:#111; display:block; margin-bottom:2px; }
    .rp-addr { font-size:12px; color:#9CA3AF; margin:0; }

    .dc-items { display:flex; align-items:center; gap:12px; padding:10px; background:#F9FAFB; border-radius:10px; margin-bottom:14px; font-size:13px; color:#6B7280; }
    .order-total { margin-left:auto; font-weight:700; color:#111; }

    .dc-actions { display:flex; gap:10px; }
    .btn-decline { flex:1; padding:12px; border:2px solid #E5E7EB; border-radius:10px; background:#fff; font-size:14px; font-weight:600; color:#6B7280; cursor:pointer; }
    .btn-accept  { flex:2; padding:12px; background:linear-gradient(135deg,#16A34A,#22C55E); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; }

    /* Active delivery */
    .active-delivery { background:#fff; border-radius:16px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .ad-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .ad-header h2 { font-size:20px; font-weight:800; color:#111; margin:0; }
    .ad-status { font-size:13px; font-weight:700; background:#FEF3C7; color:#92400E; padding:5px 14px; border-radius:20px; }

    .progress-steps { display:flex; align-items:flex-start; margin-bottom:24px; overflow-x:auto; }
    .ps-step { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; position:relative; min-width:60px; }
    .ps-dot { width:36px; height:36px; border-radius:50%; background:#E5E7EB; border:2px solid #E5E7EB; display:flex; align-items:center; justify-content:center; font-size:16px; transition:all .3s; }
    .ps-step.done .ps-dot    { background:#16A34A; border-color:#16A34A; }
    .ps-step.current .ps-dot { background:#E74C3C; border-color:#E74C3C; box-shadow:0 0 0 4px rgba(231,76,60,.2); }
    .ps-step span { font-size:10px; color:#9CA3AF; white-space:nowrap; }
    .ps-step.current span { color:#E74C3C; font-weight:600; }
    .ps-line { position:absolute; top:17px; left:calc(50% + 18px); width:calc(100% - 36px); height:2px; background:#E5E7EB; z-index:-1; }
    .ps-step.done .ps-line { background:#16A34A; }

    .ad-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:16px; }
    .ad-info-card { padding:14px; background:#F9FAFB; border-radius:12px; }
    .ad-info-card h4 { font-size:12px; font-weight:700; color:#9CA3AF; margin:0 0 8px; }
    .ad-info-card strong { font-size:14px; font-weight:700; color:#111; display:block; margin-bottom:2px; }
    .ad-info-card p { font-size:12px; color:#6B7280; margin:0 0 8px; }
    .nav-link { font-size:13px; color:#E74C3C; font-weight:600; text-decoration:none; }

    .ad-items { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px; }
    .ad-item-tag { font-size:12px; background:#F3F4F6; color:#374151; padding:4px 10px; border-radius:20px; }

    .ad-earnings-row { display:flex; align-items:center; justify-content:space-between; padding:14px; background:#D1FAE5; border-radius:12px; margin-bottom:16px; font-size:14px; color:#065F46; }
    .ad-earnings-row strong { font-size:18px; font-weight:800; }

    .btn-advance { width:100%; padding:15px; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; }
    .btn-advance:disabled { background:#9CA3AF; cursor:not-allowed; }

    /* Earnings */
    .earnings-section { }
    .earn-stats { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
    .earn-stat { background:#fff; border-radius:14px; padding:18px; box-shadow:0 2px 8px rgba(0,0,0,.05); text-align:center; }
    .es-icon { font-size:28px; display:block; margin-bottom:8px; }
    .es-label { font-size:12px; color:#9CA3AF; margin:0 0 4px; }
    .es-value { font-size:20px; font-weight:800; color:#111; margin:0; }
    .earn-hist-title { font-size:16px; font-weight:700; color:#111; margin:0 0 12px; }
    .earn-hist { display:flex; flex-direction:column; gap:8px; }
    .earn-row { display:flex; align-items:center; gap:14px; background:#fff; border-radius:12px; padding:14px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    .er-icon { font-size:22px; }
    .er-info { flex:1; }
    .er-info strong { font-size:14px; font-weight:600; color:#111; display:block; margin-bottom:2px; }
    .er-info span   { font-size:12px; color:#9CA3AF; }
    .er-earn { font-size:15px; font-weight:800; color:#16A34A; }

    /* Bottom nav */
    .bottom-nav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:600px; background:#fff; border-top:1px solid #E5E7EB; display:flex; padding:8px 0; z-index:50; }
    .bn-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; border:none; background:transparent; font-size:11px; color:#9CA3AF; cursor:pointer; padding:8px; }
    .bn-item span:first-child { font-size:22px; }
    .bn-item.active { color:#E74C3C; }
  `],
})
export class DeliveryDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private orderSvc = inject(OrderService);
  private toast    = inject(ToastService);
  private router   = inject(Router);

  isOnline         = signal(true);
  activeTab        = 'available';
  availableDeliveries = signal<any[]>([]);
  activeDelivery      = signal<any | null>(null);

  deliverySteps = [
    { status: 'assigned',   icon: '✅', label: 'Atribuída' },
    { status: 'picked_up',  icon: '🛵', label: 'Recolhido' },
    { status: 'in_transit', icon: '🚀', label: 'A caminho' },
    { status: 'delivered',  icon: '🏠', label: 'Entregue'  },
  ];

  earnStats = [
    { icon: '💰', label: 'Ganhos hoje',      value: '4.500 Kz' },
    { icon: '📦', label: 'Entregas hoje',     value: '6'        },
    { icon: '📅', label: 'Ganhos este mês',  value: '87.200 Kz'},
    { icon: '⭐', label: 'Avaliação média',   value: '4.9'      },
  ];

  earningsHistory = [
    { id: 1041, restaurant: 'Sabores de Angola',  date: 'Hoje, 14:32', earned: 1200 },
    { id: 1038, restaurant: 'Pizza Express',       date: 'Hoje, 12:10', earned: 900  },
    { id: 1035, restaurant: 'Grillmaster',         date: 'Hoje, 10:45', earned: 1500 },
    { id: 1030, restaurant: 'Cantinho do Café',    date: 'Ontem, 19:20',earned: 900  },
  ];

  ngOnInit(): void {
    this.orderSvc.getAvailableDeliveries().subscribe(data => this.availableDeliveries.set(data));
  }

  initial(): string { return (this.auth.currentUser()?.name?.[0] ?? 'E').toUpperCase(); }
  toggleOnline(): void { this.isOnline.update(v => !v); this.toast.info(this.isOnline() ? 'Agora está online!' : 'Offline. Não receberá novas entregas.'); }

  deliveryStatusLabel(s: string): string {
    const m: Record<string,string> = {
      pending: 'Pendente',
      assigned: 'Atribuída',
      picked_up: 'Recolhido',
      in_transit: 'A caminho',
      delivered: 'Entregue',
      failed: 'Falhou',
    };
    return m[s] ?? s;
  }

  stepDone(current: string, step: string): boolean {
    const order = ['assigned','picked_up','in_transit','delivered'];
    return order.indexOf(current) > order.indexOf(step);
  }

  nextDeliveryLabel(): string {
    const m: Record<string,string> = {
      assigned: '🛵 Marcar como Recolhido',
      picked_up: '🚀 Em Trânsito',
      in_transit: '🏠 Entreguei!',
    };
    return m[this.activeDelivery()?.deliveryStatus ?? ''] ?? 'Entregue';
  }

  acceptDelivery(d: any): void {
    const accepted = { ...d, deliveryStatus: 'assigned' };
    this.activeDelivery.set(accepted);
    this.availableDeliveries.update(list => list.filter(x => x.id !== d.id));
    this.activeTab = 'active';
    this.toast.success('Entrega aceite! Vá buscar o pedido.');
  }

  declineDelivery(id: number): void {
    this.availableDeliveries.update(list => list.filter(d => d.id !== id));
  }

  advanceDelivery(): void {
    const flow: Record<string,string> = { assigned: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered' };
    const next = flow[this.activeDelivery()?.deliveryStatus];
    if (!next) return;
    this.activeDelivery.update(d => ({ ...d, deliveryStatus: next }));
    if (next === 'delivered') {
      this.toast.success('Entrega concluída! 🎉 Parabéns!');
      setTimeout(() => { this.activeDelivery.set(null); this.activeTab = 'earnings'; }, 1500);
    }
  }

  logout(): void { this.auth.logout(); this.router.navigate(['/auth/login']); }
}
