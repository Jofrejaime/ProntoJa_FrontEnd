import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KzPipe } from '../../../../shared/pipes/kz.pipe';

const STATUS_FLOW: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'in_delivery',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Em preparação',
  ready: 'Pronto',
  in_delivery: 'Em entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  rejected: 'Rejeitado',
};

@Component({
  selector: 'app-restaurant-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, KzPipe],
  template: `
    <div class="dashboard-wrap">
      <!-- Sidebar (same as dashboard) -->
      <aside class="sidebar">
        <div class="brand"><span>🍽️</span><span class="brand-name">ProntoJá</span></div>
        <p class="brand-role">Painel Restaurante</p>
        <nav class="nav">
          <a routerLink="/restaurante/dashboard" class="nav-item">📊 Visão Geral</a>
          <a routerLink="/restaurante/pedidos"   class="nav-item active">📋 Pedidos</a>
          <a routerLink="/restaurante/cardapio"  class="nav-item">🍽️ Cardápio</a>
          <a routerLink="/restaurante/perfil"    class="nav-item">⚙️ Configurações</a>
        </nav>
      </aside>

      <main class="main">
        <div class="main-header">
          <h1>Gestão de Pedidos</h1>
          <div class="live-badge">🟢 Ao vivo</div>
        </div>

        <!-- Filter tabs -->
        <div class="filter-tabs">
          @for (tab of filterTabs; track tab.status) {
            <button class="ftab" [class.active]="activeFilter === tab.status"
              (click)="activeFilter = tab.status">
              {{ tab.label }}
              @if (countByStatus(tab.status) > 0) {
                <span class="ftab-count">{{ countByStatus(tab.status) }}</span>
              }
            </button>
          }
        </div>

        <!-- Orders kanban-ish list -->
        @if (loading()) {
          <div class="loading-state">⏳ A carregar pedidos…</div>
        } @else if (filtered().length === 0) {
          <div class="empty-state"><span>✅</span><p>Nenhum pedido nesta categoria.</p></div>
        } @else {
          <div class="orders-grid">
            @for (order of filtered(); track order.id) {
              <div class="order-card" [class]="'status-' + order.status.toLowerCase()">
                <div class="oc-header">
                  <div class="oc-id">#{{ order.id }}</div>
                  <span class="oc-status">{{ statusLabel(order.status) }}</span>
                  <span class="oc-time">{{ order.createdAt | date:'HH:mm' }}</span>
                </div>

                <div class="oc-customer">
                  <div class="cust-avatar">{{ order.customerName[0] }}</div>
                  <div>
                    <strong>{{ order.customerName }}</strong>
                    <p>{{ order.deliveryAddress }}</p>
                  </div>
                </div>

                <div class="oc-items">
                  @for (item of order.items; track item.productId) {
                    <div class="oc-item">
                      <span class="oc-item-qty">{{ item.quantity }}×</span>
                      <span class="oc-item-name">{{ item.productName }}</span>
                      <span class="oc-item-price">{{ item.unitPrice * item.quantity | kz }}</span>
                    </div>
                  }
                </div>

                @if (order.observations) {
                  <div class="oc-obs">💬 {{ order.observations }}</div>
                }

                <div class="oc-footer">
                  <div>
                    <span class="oc-total">{{ order.total | kz }}</span>
                    <span class="oc-payment">· {{ paymentLabel(order.paymentMethod) }}</span>
                  </div>
                  <div class="oc-actions">
                    @if (order.status === 'pending') {
                      <button class="btn-reject" (click)="reject(order.id)">Recusar</button>
                      <button class="btn-accept" (click)="advance(order)">✓ Aceitar</button>
                    } @else if (nextStatus(order.status)) {
                      <button class="btn-next" (click)="advance(order)">
                        {{ nextLabel(order.status) }} →
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F1F5F9; min-height:100vh; }
    .dashboard-wrap { display:grid; grid-template-columns:240px 1fr; min-height:100vh; }

    /* Sidebar */
    .sidebar { background:#fff; border-right:1px solid #E5E7EB; display:flex; flex-direction:column; padding:24px 16px; position:sticky; top:0; height:100vh; }
    .brand { display:flex; align-items:center; gap:8px; font-size:20px; font-weight:800; color:#C0392B; margin-bottom:4px; }
    .brand-name { }
    .brand-role { font-size:11px; color:#9CA3AF; text-transform:uppercase; letter-spacing:.5px; margin:0 0 32px 32px; }
    .nav { display:flex; flex-direction:column; gap:4px; }
    .nav-item { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:10px; text-decoration:none; font-size:14px; font-weight:500; color:#374151; transition:all .2s; }
    .nav-item:hover, .nav-item.active { background:#FEF2F2; color:#C0392B; font-weight:600; }

    /* Main */
    .main { padding:32px; }
    .main-header { display:flex; align-items:center; gap:16px; margin-bottom:28px; }
    .main-header h1 { font-size:26px; font-weight:800; color:#111; margin:0; }
    .live-badge { background:#D1FAE5; color:#065F46; font-size:12px; font-weight:700; padding:5px 12px; border-radius:20px; }

    /* Filter tabs */
    .filter-tabs { display:flex; gap:6px; margin-bottom:24px; flex-wrap:wrap; }
    .ftab { padding:8px 18px; border:2px solid #E5E7EB; border-radius:20px; background:#fff; font-size:13px; font-weight:500; color:#374151; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; }
    .ftab.active { background:#E74C3C; border-color:#E74C3C; color:#fff; }
    .ftab-count { background:rgba(255,255,255,.3); padding:1px 7px; border-radius:10px; font-size:12px; font-weight:700; }
    .ftab:not(.active) .ftab-count { background:#F3F4F6; color:#6B7280; }

    /* States */
    .loading-state { text-align:center; padding:60px; font-size:16px; color:#9CA3AF; }
    .empty-state { text-align:center; padding:60px; }
    .empty-state span { font-size:40px; display:block; margin-bottom:10px; }
    .empty-state p { color:#9CA3AF; font-size:15px; }

    /* Orders grid */
    .orders-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:16px; }

    /* Order card */
    .order-card { background:#fff; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); border-left:4px solid #E5E7EB; }
    .order-card.status-pending   { border-left-color:#F59E0B; }
    .order-card.status-confirmed { border-left-color:#3B82F6; }
    .order-card.status-accepted  { border-left-color:#3B82F6; }
    .order-card.status-preparing { border-left-color:#8B5CF6; }
    .order-card.status-ready     { border-left-color:#10B981; }
    .order-card.status-in_delivery { border-left-color:#E74C3C; }
    .order-card.status-cancelled { border-left-color:#9CA3AF; opacity:.6; }
    .order-card.status-rejected  { border-left-color:#9CA3AF; opacity:.6; }
    .order-card.status-canceled  { border-left-color:#9CA3AF; opacity:.6; }

    .oc-header { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
    .oc-id { font-size:14px; font-weight:800; color:#111; }
    .oc-status { flex:1; font-size:12px; font-weight:600; color:#6B7280; }
    .oc-time { font-size:12px; color:#9CA3AF; }

    .oc-customer { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
    .cust-avatar { width:36px; height:36px; border-radius:50%; background:#E74C3C; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .oc-customer strong { font-size:14px; font-weight:700; color:#111; display:block; margin-bottom:2px; }
    .oc-customer p { font-size:12px; color:#9CA3AF; margin:0; }

    .oc-items { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; padding:12px; background:#F9FAFB; border-radius:10px; }
    .oc-item { display:flex; align-items:center; gap:8px; font-size:13px; }
    .oc-item-qty  { font-weight:700; color:#9CA3AF; }
    .oc-item-name { flex:1; color:#374151; }
    .oc-item-price { font-weight:600; color:#111; }

    .oc-obs { font-size:12px; color:#6B7280; background:#FFFBEB; border:1px solid #FEF3C7; border-radius:8px; padding:8px 12px; margin-bottom:12px; }

    .oc-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .oc-total { font-size:16px; font-weight:800; color:#111; }
    .oc-payment { font-size:12px; color:#9CA3AF; }
    .oc-actions { display:flex; gap:8px; }

    .btn-accept { padding:8px 16px; background:#16A34A; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
    .btn-reject { padding:8px 14px; background:#FEF2F2; color:#EF4444; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
    .btn-next   { padding:8px 16px; background:#3B82F6; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }

    @media(max-width:768px) { .dashboard-wrap { grid-template-columns:1fr; } .sidebar { display:none; } }
  `],
})
export class RestaurantOrdersComponent implements OnInit {
  private orderSvc = inject(OrderService);
  private toast    = inject(ToastService);

  orders   = signal<any[]>([]);
  loading  = signal(true);
  activeFilter = 'ALL';

  filterTabs = [
    { status: 'ALL',      label: 'Todos'       },
    { status: 'pending',     label: 'Pendentes'   },
    { status: 'confirmed',   label: 'Confirmados' },
    { status: 'preparing',   label: 'Em preparo'  },
    { status: 'ready',       label: 'Prontos'     },
    { status: 'in_delivery', label: 'Em entrega'  },
    { status: 'delivered',   label: 'Entregues'   },
  ];

  ngOnInit(): void {
    this.orderSvc.getRestaurantOrders().subscribe(data => {
      this.orders.set(data);
      this.loading.set(false);
    });
  }

  filtered(): any[] {
    if (this.activeFilter === 'ALL') return this.orders();
    return this.orders().filter(o => o.status === this.activeFilter);
  }

  countByStatus(status: string): number {
    if (status === 'ALL') return 0;
    return this.orders().filter(o => o.status === status).length;
  }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  nextStatus(s: string): string | null { return STATUS_FLOW[s] ?? null; }

  nextLabel(s: string): string {
    const labels: Record<string, string> = { pending: 'Aceitar', confirmed: 'Iniciar Preparo', preparing: 'Marcar Pronto', ready: 'Saiu para Entrega' };
    return labels[s] ?? 'Avançar';
  }

  paymentLabel(m: string): string {
    const map: Record<string, string> = { cash: 'Dinheiro', card: 'Cartão', online: 'Online', multicaixa: 'Multicaixa' };
    return map[m] ?? m;
  }

  advance(order: any): void {
    const next = this.nextStatus(order.status);
    if (!next) return;
    this.orderSvc.updateStatus(order.id, next).subscribe(() => {
      this.orders.update(list => list.map(o => o.id === order.id ? { ...o, status: next } : o));
      this.toast.success(`Pedido #${order.id} → ${this.statusLabel(next)}`);
    });
  }

  reject(id: number): void {
    this.orderSvc.updateStatus(id, 'rejected').subscribe(() => {
      this.orders.update(list => list.map(o => o.id === id ? { ...o, status: 'rejected' } : o));
      this.toast.error(`Pedido #${id} recusado.`);
    });
  }
}
