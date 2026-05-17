import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { KzPipe } from '../../../../shared/pipes/kz.pipe';

@Component({
  selector: 'app-restaurant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, KzPipe],
  template: `
    <!-- Sidebar layout -->
    <div class="dashboard-wrap">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-icon">🍽️</span>
          <span class="brand-name">ProntoJá</span>
        </div>
        <p class="brand-role">Painel Restaurante</p>

        <nav class="nav">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" class="nav-item" routerLinkActive="active">
              <span>{{ item.icon }}</span> {{ item.label }}
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ initial() }}</div>
            <div>
              <strong>{{ auth.currentUser()?.name }}</strong>
              <p>Restaurante</p>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">🚪</button>
        </div>
      </aside>

      <!-- Main -->
      <main class="main">
        <div class="main-header">
          <div>
            <h1>Visão Geral</h1>
            <p>Bem-vindo de volta! Aqui está o resumo de hoje.</p>
          </div>
          <div class="header-actions">
            <span class="date-badge">📅 Hoje, {{ todayDate() }}</span>
          </div>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid">
          @for (kpi of kpis; track kpi.label) {
            <div class="kpi-card">
              <div class="kpi-icon" [style.background]="kpi.bg">{{ kpi.icon }}</div>
              <div class="kpi-body">
                <p class="kpi-label">{{ kpi.label }}</p>
                <h2 class="kpi-value">{{ kpi.value }}</h2>
                <span class="kpi-delta" [class.up]="kpi.up" [class.down]="!kpi.up">
                  {{ kpi.up ? '↑' : '↓' }} {{ kpi.delta }}
                </span>
              </div>
            </div>
          }
        </div>

        <!-- Active orders + Top products -->
        <div class="panels-row">
          <!-- Active orders -->
          <div class="panel">
            <div class="panel-header">
              <h3>Pedidos Activos</h3>
              <a routerLink="/restaurante/pedidos" class="see-all">Ver todos →</a>
            </div>
            @if (activeOrders().length === 0) {
              <div class="no-orders">
                <span>✅</span>
                <p>Nenhum pedido pendente</p>
              </div>
            } @else {
              <div class="orders-list">
                @for (order of activeOrders(); track order.id) {
                  <div class="order-row">
                    <div class="order-id">#{{ order.id }}</div>
                    <div class="order-info">
                      <strong>{{ order.customerName }}</strong>
                      <span>{{ order.itemCount }} iten{{ order.itemCount !== 1 ? 's' : '' }}</span>
                    </div>
                    <span class="order-status" [class]="'s-' + order.status.toLowerCase()">
                      {{ statusLabel(order.status) }}
                    </span>
                    <span class="order-total">{{ order.total | kz }}</span>
                    <div class="order-actions">
                      <button class="act-btn accept" *ngIf="order.status === 'pending'"
                        (click)="updateStatus(order.id, 'confirmed')">Aceitar</button>
                      <button class="act-btn next" *ngIf="order.status === 'confirmed'"
                        (click)="updateStatus(order.id, 'preparing')">Iniciar</button>
                      <button class="act-btn next" *ngIf="order.status === 'preparing'"
                        (click)="updateStatus(order.id, 'ready')">Pronto</button>
                      <button class="act-btn cancel" *ngIf="order.status === 'pending'"
                        (click)="updateStatus(order.id, 'rejected')">Recusar</button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Top products -->
          <div class="panel panel-sm">
            <div class="panel-header">
              <h3>Mais Vendidos</h3>
            </div>
            <div class="top-products">
              @for (p of topProducts; track p.name; let i = $index) {
                <div class="top-product">
                  <div class="rank">{{ i + 1 }}</div>
                  <div class="tp-emoji">{{ p.emoji }}</div>
                  <div class="tp-info">
                    <strong>{{ p.name }}</strong>
                    <span>{{ p.orders }} pedidos</span>
                  </div>
                  <div class="tp-revenue">{{ p.revenue | kz }}</div>
                </div>
              }
            </div>

            <!-- Weekly chart (visual bars) -->
            <div class="panel-header" style="margin-top:24px">
              <h3>Pedidos esta semana</h3>
            </div>
            <div class="bar-chart">
              @for (d of weekData; track d.day) {
                <div class="bar-col">
                  <div class="bar" [style.height.%]="d.pct"></div>
                  <span class="bar-label">{{ d.day }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F1F5F9; min-height:100vh; }

    /* Layout */
    .dashboard-wrap { display:grid; grid-template-columns:240px 1fr; min-height:100vh; }

    /* Sidebar */
    .sidebar { background:#fff; border-right:1px solid #E5E7EB; display:flex; flex-direction:column; padding:24px 16px; position:sticky; top:0; height:100vh; overflow-y:auto; }
    .brand { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .brand-icon { font-size:24px; }
    .brand-name { font-size:20px; font-weight:800; color:#C0392B; }
    .brand-role { font-size:11px; color:#9CA3AF; text-transform:uppercase; letter-spacing:.5px; margin:0 0 32px 32px; }

    .nav { display:flex; flex-direction:column; gap:4px; flex:1; }
    .nav-item { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:10px; text-decoration:none; font-size:14px; font-weight:500; color:#374151; transition:all .2s; }
    .nav-item:hover, .nav-item.active { background:#FEF2F2; color:#C0392B; font-weight:600; }

    .sidebar-footer { display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid #F3F4F6; margin-top:auto; }
    .user-info { display:flex; align-items:center; gap:10px; }
    .user-avatar { width:36px; height:36px; border-radius:50%; background:#E74C3C; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .user-info strong { font-size:13px; color:#111; display:block; }
    .user-info p { font-size:11px; color:#9CA3AF; margin:0; }
    .logout-btn { background:none; border:none; font-size:18px; cursor:pointer; opacity:.5; }
    .logout-btn:hover { opacity:1; }

    /* Main */
    .main { padding:32px; }
    .main-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:32px; }
    .main-header h1 { font-size:26px; font-weight:800; color:#111; margin:0 0 4px; }
    .main-header p  { font-size:14px; color:#6B7280; margin:0; }
    .date-badge { font-size:13px; color:#6B7280; background:#fff; border:1px solid #E5E7EB; padding:8px 14px; border-radius:8px; }

    /* KPIs */
    .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
    .kpi-card { background:#fff; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.05); display:flex; align-items:center; gap:16px; }
    .kpi-icon { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
    .kpi-label { font-size:12px; color:#9CA3AF; margin:0 0 4px; text-transform:uppercase; letter-spacing:.3px; }
    .kpi-value { font-size:22px; font-weight:800; color:#111; margin:0 0 4px; }
    .kpi-delta { font-size:12px; font-weight:600; }
    .kpi-delta.up   { color:#16A34A; }
    .kpi-delta.down { color:#EF4444; }

    /* Panels */
    .panels-row { display:grid; grid-template-columns:1fr 340px; gap:20px; }
    .panel { background:#fff; border-radius:16px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
    .panel.panel-sm { }
    .panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .panel-header h3 { font-size:16px; font-weight:700; color:#111; margin:0; }
    .see-all { font-size:13px; color:#E74C3C; text-decoration:none; font-weight:600; }

    .no-orders { text-align:center; padding:32px; }
    .no-orders span { font-size:32px; display:block; margin-bottom:8px; }
    .no-orders p { color:#9CA3AF; font-size:14px; margin:0; }

    /* Orders list */
    .orders-list { display:flex; flex-direction:column; gap:10px; }
    .order-row { display:flex; align-items:center; gap:12px; padding:14px; background:#F9FAFB; border-radius:12px; flex-wrap:wrap; }
    .order-id { font-size:13px; font-weight:700; color:#9CA3AF; min-width:40px; }
    .order-info { flex:1; min-width:0; }
    .order-info strong { font-size:14px; font-weight:600; color:#111; display:block; }
    .order-info span   { font-size:12px; color:#9CA3AF; }
    .order-status { font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; }
    .s-pending  { background:#FEF3C7; color:#92400E; }
    .s-confirmed { background:#DBEAFE; color:#1E40AF; }
    .s-accepted { background:#DBEAFE; color:#1E40AF; }
    .s-preparing { background:#EDE9FE; color:#5B21B6; }
    .s-ready    { background:#D1FAE5; color:#065F46; }
    .s-rejected { background:#FEE2E2; color:#991B1B; }
    .order-total { font-size:14px; font-weight:700; color:#111; }
    .order-actions { display:flex; gap:6px; }
    .act-btn { padding:6px 12px; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; }
    .act-btn.accept { background:#16A34A; color:#fff; }
    .act-btn.next   { background:#3B82F6; color:#fff; }
    .act-btn.cancel { background:#FEF2F2; color:#EF4444; }

    /* Top products */
    .top-products { display:flex; flex-direction:column; gap:10px; margin-bottom:8px; }
    .top-product { display:flex; align-items:center; gap:12px; padding:10px; border-radius:10px; background:#F9FAFB; }
    .rank { font-size:13px; font-weight:800; color:#C0392B; min-width:18px; }
    .tp-emoji { font-size:22px; }
    .tp-info { flex:1; }
    .tp-info strong { font-size:13px; font-weight:600; color:#111; display:block; }
    .tp-info span   { font-size:12px; color:#9CA3AF; }
    .tp-revenue { font-size:13px; font-weight:700; color:#111; }

    /* Bar chart */
    .bar-chart { display:flex; align-items:flex-end; gap:10px; height:80px; }
    .bar-col { display:flex; flex-direction:column; align-items:center; flex:1; height:100%; justify-content:flex-end; gap:4px; }
    .bar { width:100%; background:linear-gradient(180deg,#E74C3C,#C0392B); border-radius:4px 4px 0 0; min-height:4px; transition:height .3s; }
    .bar-label { font-size:11px; color:#9CA3AF; }

    @media(max-width:1100px) {
      .kpi-grid { grid-template-columns:repeat(2,1fr); }
      .panels-row { grid-template-columns:1fr; }
    }
    @media(max-width:768px) {
      .dashboard-wrap { grid-template-columns:1fr; }
      .sidebar { height:auto; position:static; flex-direction:row; flex-wrap:wrap; }
    }
  `],
})
export class RestaurantDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private orderSvc = inject(OrderService);

  activeOrders = signal<any[]>([]);

  navItems = [
    { path: '/restaurante/dashboard', icon: '📊', label: 'Visão Geral' },
    { path: '/restaurante/pedidos',   icon: '📋', label: 'Pedidos' },
    { path: '/restaurante/cardapio',  icon: '🍽️', label: 'Cardápio' },
    { path: '/restaurante/perfil',    icon: '⚙️', label: 'Configurações' },
  ];

  kpis = [
    { icon: '💰', label: 'Receita Hoje',     value: '85.400 Kz', delta: '12% vs ontem', up: true,  bg: '#FEF3C7' },
    { icon: '📋', label: 'Pedidos Hoje',      value: '18',        delta: '3 vs ontem',   up: true,  bg: '#DBEAFE' },
    { icon: '⭐', label: 'Avaliação Média',   value: '4.7',       delta: '0.1 esta semana', up: true, bg: '#D1FAE5' },
    { icon: '⏱️', label: 'Tempo Médio',       value: '28 min',    delta: '2 min melhor', up: true,  bg: '#EDE9FE' },
  ];

  topProducts = [
    { emoji: '🍗', name: 'Muamba de Frango',   orders: 42, revenue: 336000 },
    { emoji: '🐟', name: 'Calulu de Peixe',    orders: 31, revenue: 217000 },
    { emoji: '🍌', name: 'Arroz de Banana',    orders: 28, revenue: 168000 },
    { emoji: '🥩', name: 'Grelhado Misto',     orders: 19, revenue: 209000 },
    { emoji: '🥤', name: 'Sumo de Múcua',      orders: 17, revenue: 51000  },
  ];

  weekData = [
    { day: 'Seg', pct: 55 }, { day: 'Ter', pct: 70 }, { day: 'Qua', pct: 45 },
    { day: 'Qui', pct: 85 }, { day: 'Sex', pct: 95 }, { day: 'Sáb', pct: 100 },
    { day: 'Dom', pct: 60 },
  ];

  ngOnInit(): void {
    this.orderSvc.getRestaurantOrders().subscribe(orders => this.activeOrders.set(orders));
  }

  initial(): string { return (this.auth.currentUser()?.name?.[0] ?? 'R').toUpperCase(); }
  todayDate(): string { return new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'long' }); }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Em preparação',
      ready: 'Pronto',
      rejected: 'Rejeitado',
    };
    return m[s] ?? s;
  }

  updateStatus(orderId: number, status: string): void {
    this.orderSvc.updateStatus(orderId, status).subscribe(() => {
      this.activeOrders.update(orders =>
        status === 'rejected'
          ? orders.filter(o => o.id !== orderId)
          : orders.map(o => o.id === orderId ? { ...o, status } : o)
      );
    });
  }

  logout(): void { inject(AuthService).logout(); }
}
