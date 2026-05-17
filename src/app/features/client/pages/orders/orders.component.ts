import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { OrderService } from '../../../../core/services/order.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KzPipe } from '../../../../shared/pipes/kz.pipe';
import { Order } from '../../../../core/models';

const STATUS_META: Record<string, { label: string; icon: string; color: string }> = {
  pending:     { label: 'Aguarda confirmação', icon: '⏳', color: '#F59E0B' },
  confirmed:   { label: 'Confirmado pelo restaurante', icon: '✅', color: '#3B82F6' },
  preparing:   { label: 'Em preparação', icon: '👨‍🍳', color: '#8B5CF6' },
  ready:       { label: 'Pronto para recolha', icon: '🎉', color: '#10B981' },
  in_delivery: { label: 'Saiu para entrega', icon: '🛵', color: '#E74C3C' },
  delivered:   { label: 'Entregue', icon: '🏠', color: '#16A34A' },
  cancelled:   { label: 'Cancelado', icon: '❌', color: '#6B7280' },
  rejected:    { label: 'Rejeitado pelo restaurante', icon: '❌', color: '#6B7280' },
};

const STEPS = ['pending','confirmed','preparing','ready','in_delivery','delivered'];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, KzPipe],
  template: `
    <app-navbar />

    <div class="page">
      <h1 class="page-title">Os Meus Pedidos</h1>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'active'"   (click)="setTab('active')">Activos</button>
        <button class="tab" [class.active]="activeTab === 'history'"  (click)="setTab('history')">Histórico</button>
      </div>

      @if (loading()) {
        <div class="skeleton-list">
          @for (i of [1,2,3]; track i) { <div class="order-skeleton"></div> }
        </div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <span>📦</span>
          <h3>{{ activeTab === 'active' ? 'Nenhum pedido activo' : 'Sem histórico ainda' }}</h3>
          <p>Os seus pedidos aparecerão aqui.</p>
          <a routerLink="/cliente/restaurantes" class="btn-primary">Fazer Pedido</a>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of filtered(); track order.id) {
            <div class="order-card" [class.expanded]="expanded() === order.id"
              (click)="toggle(order.id)">
              <div class="order-header">
                <div class="order-left">
                  <div class="order-icon">{{ statusMeta(order.status).icon }}</div>
                  <div>
                    <h3>Pedido #{{ order.id }}</h3>
                    <p class="rest-name">🏪 {{ order.restaurantName }}</p>
                  </div>
                </div>
                <div class="order-right">
                  <span class="status-badge" [style.background]="statusMeta(order.status).color + '20'"
                    [style.color]="statusMeta(order.status).color">
                    {{ statusMeta(order.status).label }}
                  </span>
                  <p class="order-total">{{ order.total | kz }}</p>
                  <span class="expand-arrow">{{ expanded() === order.id ? '▲' : '▼' }}</span>
                </div>
              </div>

              @if (expanded() === order.id) {
                <div class="order-detail" (click)="$event.stopPropagation()">

                  <!-- Tracker (only for active orders) -->
                  @if (order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'rejected') {
                    <div class="tracker">
                      @for (step of steps; track step; let i = $index) {
                        <div class="tracker-step" [class.done]="stepDone(order.status, step)"
                          [class.current]="order.status === step">
                          <div class="step-dot"></div>
                          @if (i < steps.length - 1) { <div class="step-line"></div> }
                          <span class="step-label">{{ statusMeta(step).icon }}</span>
                        </div>
                      }
                    </div>
                    <p class="tracker-status">{{ statusMeta(order.status).label }}</p>
                  }

                  <!-- Items -->
                  <div class="detail-section">
                    <h4>Itens</h4>
                    @for (item of order.items; track item.productId) {
                      <div class="detail-item">
                        <span class="di-qty">{{ item.quantity }}×</span>
                        <span class="di-name">{{ item.productName }}</span>
                        <span class="di-price">{{ item.unitPrice * item.quantity | kz }}</span>
                      </div>
                    }
                  </div>

                  <!-- Summary -->
                  <div class="detail-summary">
                    <div class="ds-row"><span>Subtotal</span><span>{{ order.subtotal | kz }}</span></div>
                    <div class="ds-row"><span>Entrega</span><span>{{ order.deliveryFee | kz }}</span></div>
                    <div class="ds-row bold"><span>Total</span><span>{{ order.total | kz }}</span></div>
                  </div>

                  <div class="detail-meta">
                    <span>📅 {{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    <span>💳 {{ paymentLabel(order.paymentMethod) }}</span>
                    <span>📍 {{ order.deliveryAddress }}</span>
                  </div>

                  @if (order.status === 'delivered') {
                    <button class="btn-reorder" (click)="reorder(order)">🔄 Repetir pedido</button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F9FAFB; min-height:100vh; }
    .page { max-width:800px; margin:0 auto; padding:32px 24px 64px; }

    .page-title { font-size:28px; font-weight:800; color:#111; margin:0 0 24px; }

    /* Tabs */
    .tabs { display:flex; gap:4px; margin-bottom:28px; background:#F3F4F6; border-radius:10px; padding:4px; width:fit-content; }
    .tab { padding:9px 24px; border:none; border-radius:8px; background:transparent; font-size:14px; font-weight:500; color:#6B7280; cursor:pointer; transition:all .2s; }
    .tab.active { background:#fff; color:#111; font-weight:700; box-shadow:0 1px 4px rgba(0,0,0,.08); }

    /* Skeleton */
    .skeleton-list { display:flex; flex-direction:column; gap:12px; }
    .order-skeleton { height:100px; background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%); background-size:200% 100%; border-radius:16px; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Empty */
    .empty-state { text-align:center; padding:80px 20px; }
    .empty-state span { font-size:56px; display:block; margin-bottom:16px; }
    .empty-state h3 { font-size:20px; font-weight:700; color:#111; margin:0 0 8px; }
    .empty-state p { color:#6B7280; font-size:15px; margin:0 0 24px; }
    .btn-primary { display:inline-block; padding:13px 24px; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; border-radius:10px; text-decoration:none; font-size:14px; font-weight:700; }

    /* Order card */
    .orders-list { display:flex; flex-direction:column; gap:12px; }
    .order-card { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,.06); overflow:hidden; cursor:pointer; transition:box-shadow .2s; }
    .order-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.10); }
    .order-card.expanded { box-shadow:0 4px 20px rgba(0,0,0,.10); }

    .order-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; gap:16px; }
    .order-left { display:flex; align-items:center; gap:16px; }
    .order-icon { font-size:28px; width:48px; height:48px; background:#F9FAFB; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .order-left h3 { font-size:15px; font-weight:700; color:#111; margin:0 0 2px; }
    .rest-name { font-size:13px; color:#6B7280; margin:0; }
    .order-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
    .status-badge { font-size:12px; font-weight:600; padding:4px 12px; border-radius:20px; white-space:nowrap; }
    .order-total { font-size:15px; font-weight:700; color:#111; margin:0; }
    .expand-arrow { font-size:12px; color:#9CA3AF; }

    /* Detail */
    .order-detail { padding:0 24px 24px; border-top:1px solid #F3F4F6; margin-top:0; }

    /* Tracker */
    .tracker { display:flex; align-items:center; padding:20px 0 4px; }
    .tracker-step { display:flex; align-items:center; flex:1; position:relative; }
    .tracker-step:last-child { flex:none; }
    .step-dot { width:14px; height:14px; border-radius:50%; background:#E5E7EB; border:2px solid #E5E7EB; transition:all .3s; flex-shrink:0; }
    .tracker-step.done .step-dot   { background:#16A34A; border-color:#16A34A; }
    .tracker-step.current .step-dot { background:#E74C3C; border-color:#E74C3C; box-shadow:0 0 0 4px rgba(231,76,60,.2); }
    .step-line { flex:1; height:2px; background:#E5E7EB; transition:all .3s; }
    .tracker-step.done .step-line { background:#16A34A; }
    .step-label { position:absolute; top:20px; left:50%; transform:translateX(-50%); font-size:14px; white-space:nowrap; }
    .tracker-status { text-align:center; font-size:14px; font-weight:600; color:#E74C3C; margin:24px 0 16px; }

    /* Detail items */
    .detail-section { margin-bottom:16px; }
    .detail-section h4 { font-size:13px; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:.5px; margin:0 0 10px; }
    .detail-item { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #F9FAFB; }
    .di-qty  { font-size:13px; font-weight:700; color:#6B7280; width:28px; }
    .di-name { flex:1; font-size:14px; color:#111; }
    .di-price { font-size:14px; font-weight:600; color:#111; }

    /* Summary */
    .detail-summary { border-top:1px solid #F3F4F6; padding-top:12px; display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
    .ds-row { display:flex; justify-content:space-between; font-size:14px; color:#6B7280; }
    .ds-row.bold { font-size:15px; font-weight:700; color:#111; padding-top:8px; border-top:1px solid #F3F4F6; }

    /* Meta */
    .detail-meta { display:flex; flex-wrap:wrap; gap:10px 20px; font-size:12px; color:#9CA3AF; margin-bottom:16px; }

    .btn-reorder { padding:11px 20px; background:#F3F4F6; border:none; border-radius:10px; font-size:14px; font-weight:600; color:#374151; cursor:pointer; transition:all .2s; }
    .btn-reorder:hover { background:#E74C3C; color:#fff; }
  `],
})
export class OrdersComponent implements OnInit {
  private orderSvc = inject(OrderService);
  private toast    = inject(ToastService);

  orders   = signal<Order[]>([]);
  loading  = signal(true);
  activeTab = 'active';
  expanded = signal<number | null>(null);

  steps = STEPS;

  ngOnInit(): void {
    this.orderSvc.getHistory().subscribe(data => {
      this.orders.set(data);
      this.loading.set(false);
    });
  }

  filtered(): Order[] {
    if (this.activeTab === 'active') {
      return this.orders().filter(o => !['delivered','cancelled','rejected'].includes(o.status));
    }
    return this.orders().filter(o => ['delivered','cancelled','rejected'].includes(o.status));
  }

  setTab(tab: string): void { this.activeTab = tab; this.expanded.set(null); }
  toggle(id: number):   void { this.expanded.set(this.expanded() === id ? null : id); }

  statusMeta(status: string) { return STATUS_META[status] ?? STATUS_META['pending']; }

  stepDone(current: string, step: string): boolean {
    return STEPS.indexOf(current) > STEPS.indexOf(step);
  }

  paymentLabel(method: string): string {
    const map: Record<string, string> = { cash: 'Dinheiro', card: 'Cartão', online: 'Online', multicaixa: 'Multicaixa' };
    return map[method] ?? method;
  }

  reorder(order: Order): void {
    this.toast.info('A adicionar itens ao carrinho…');
    // CartService.addMany(order.items) would be called here
  }
}
