import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KzPipe } from '../../../../shared/pipes/kz.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent, KzPipe],
  template: `
    <app-navbar />

    <div class="page">
      <div class="page-header">
        <a routerLink="/cliente/inicio" class="back-link">← Continuar a comprar</a>
        <h1>O Meu Carrinho</h1>
      </div>

      @if (cart.totalItems() === 0) {
        <!-- Empty cart -->
        <div class="empty-cart">
          <div class="empty-icon">🛒</div>
          <h2>Carrinho vazio</h2>
          <p>Adicione produtos de um restaurante para começar o seu pedido.</p>
          <a routerLink="/cliente/restaurantes" class="btn-primary">Ver Restaurantes</a>
        </div>
      } @else {
        <div class="cart-layout">
          <!-- Left — Items -->
          <div class="cart-items-col">

            <!-- Restaurant info -->
            <div class="section-card">
              <h2 class="section-title">🏪 Itens do Pedido</h2>
              <div class="items-list">
                @for (item of cart.items(); track item.product.id) {
                  <div class="cart-item">
                    <div class="item-emoji-wrap">{{ productEmoji(item.product.name) }}</div>
                    <div class="item-info">
                      <h4>{{ item.product.name }}</h4>
                      <p class="item-price-unit">{{ item.product.price | kz }} / un.</p>
                    </div>
                    <div class="item-qty">
                      <button class="qty-btn" (click)="cart.decrement(item.product.id)">−</button>
                      <span class="qty-val">{{ item.quantity }}</span>
                      <button class="qty-btn" (click)="cart.increment(item.product.id)">+</button>
                    </div>
                    <div class="item-total">{{ item.product.price * item.quantity | kz }}</div>
                    <button class="remove-btn" (click)="cart.remove(item.product.id)" title="Remover">🗑️</button>
                  </div>
                }
              </div>
              <button class="clear-cart" (click)="confirmClear()">Limpar carrinho</button>
            </div>

            <!-- Delivery address -->
            <div class="section-card">
              <h2 class="section-title">📍 Endereço de Entrega</h2>
              <div class="address-options">
                @for (addr of savedAddresses; track addr.id) {
                  <label class="address-option" [class.selected]="selectedAddress === addr.id">
                    <input type="radio" [(ngModel)]="selectedAddress" [value]="addr.id">
                    <div class="addr-body">
                      <strong>{{ addr.label }}</strong>
                      <span>{{ addr.address }}</span>
                    </div>
                    @if (selectedAddress === addr.id) { <span class="check">✓</span> }
                  </label>
                }
              </div>
              <input type="text" class="other-address-input" [(ngModel)]="customAddress"
                placeholder="Ou escreva outro endereço…">
            </div>

            <!-- Observations -->
            <div class="section-card">
              <h2 class="section-title">📝 Observações</h2>
              <textarea class="observations" [(ngModel)]="observations" rows="3"
                placeholder="Alguma instrução especial? (ex: sem cebola, entrada pelo portão lateral…)"></textarea>
            </div>
          </div>

          <!-- Right — Summary -->
          <div class="summary-col">
            <div class="summary-card">
              <h2 class="section-title">Resumo do Pedido</h2>

              <div class="summary-rows">
                <div class="sum-row"><span>Subtotal</span><span>{{ cart.subtotal() | kz }}</span></div>
                <div class="sum-row"><span>Entrega</span><span class="green">{{ deliveryFee === 0 ? 'Grátis' : (deliveryFee | kz) }}</span></div>
                @if (discount > 0) {
                  <div class="sum-row discount"><span>Desconto ({{ promoCode }})</span><span>−{{ discount | kz }}</span></div>
                }
                <div class="sum-row total"><span>Total</span><span>{{ cart.subtotal() + deliveryFee - discount | kz }}</span></div>
              </div>

              <!-- Promo code -->
              <div class="promo-row">
                <input type="text" [(ngModel)]="promoInput" placeholder="Código promocional" class="promo-input">
                <button class="promo-btn" (click)="applyPromo()">Aplicar</button>
              </div>
              @if (promoError) { <p class="promo-error">{{ promoError }}</p> }

              <!-- Payment -->
              <div class="payment-section">
                <h3>Forma de Pagamento</h3>
                <div class="payment-options">
                  @for (p of paymentMethods; track p.id) {
                    <label class="payment-option" [class.selected]="selectedPayment === p.id">
                      <input type="radio" [(ngModel)]="selectedPayment" [value]="p.id">
                      <span class="pay-icon">{{ p.icon }}</span>
                      <span>{{ p.label }}</span>
                    </label>
                  }
                </div>
              </div>

              <button class="btn-checkout" [disabled]="placing()" (click)="placeOrder()">
                @if (placing()) {
                  <span class="spinner"></span> A processar…
                } @else {
                  ✅ Confirmar Pedido · {{ cart.subtotal() + deliveryFee - discount | kz }}
                }
              </button>

              <p class="secure-note">🔒 Pagamento seguro e encriptado</p>
            </div>

            <!-- Estimated time card -->
            <div class="eta-card">
              <div class="eta-icon">🕐</div>
              <div>
                <strong>Tempo estimado de entrega</strong>
                <p>30 – 45 minutos</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F9FAFB; min-height:100vh; }
    .page { max-width:1200px; margin:0 auto; padding:32px 24px 64px; }

    .page-header { margin-bottom:28px; }
    .back-link { font-size:13px; color:#E74C3C; text-decoration:none; font-weight:500; }
    .back-link:hover { text-decoration:underline; }
    .page-header h1 { font-size:28px; font-weight:800; color:#111; margin:8px 0 0; }

    /* Empty */
    .empty-cart { text-align:center; padding:80px 20px; }
    .empty-icon { font-size:72px; margin-bottom:16px; }
    .empty-cart h2 { font-size:24px; font-weight:700; color:#111; margin:0 0 8px; }
    .empty-cart p  { color:#6B7280; font-size:15px; margin:0 0 28px; }
    .btn-primary { display:inline-block; padding:14px 28px; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; border-radius:10px; text-decoration:none; font-size:15px; font-weight:700; }

    /* Layout */
    .cart-layout { display:grid; grid-template-columns:1fr 380px; gap:28px; align-items:start; }
    .cart-items-col { display:flex; flex-direction:column; gap:20px; }

    .section-card { background:#fff; border-radius:16px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,.06); }
    .section-title { font-size:16px; font-weight:700; color:#111; margin:0 0 20px; }

    /* Items */
    .items-list { display:flex; flex-direction:column; gap:12px; }
    .cart-item { display:flex; align-items:center; gap:14px; padding:12px; background:#F9FAFB; border-radius:12px; }
    .item-emoji-wrap { width:48px; height:48px; background:#FEF2F2; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:26px; flex-shrink:0; }
    .item-info { flex:1; min-width:0; }
    .item-info h4 { font-size:14px; font-weight:700; color:#111; margin:0 0 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .item-price-unit { font-size:12px; color:#9CA3AF; margin:0; }
    .item-qty { display:flex; align-items:center; gap:10px; }
    .qty-btn { width:28px; height:28px; border:2px solid #E5E7EB; border-radius:8px; background:#fff; font-size:16px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
    .qty-btn:hover { border-color:#E74C3C; color:#E74C3C; }
    .qty-val { font-size:15px; font-weight:700; color:#111; min-width:20px; text-align:center; }
    .item-total { font-size:14px; font-weight:700; color:#111; min-width:80px; text-align:right; }
    .remove-btn { background:none; border:none; cursor:pointer; font-size:18px; opacity:.5; transition:opacity .2s; flex-shrink:0; }
    .remove-btn:hover { opacity:1; }
    .clear-cart { margin-top:16px; background:none; border:none; color:#9CA3AF; font-size:13px; cursor:pointer; text-decoration:underline; }
    .clear-cart:hover { color:#E74C3C; }

    /* Address */
    .address-options { display:flex; flex-direction:column; gap:10px; margin-bottom:14px; }
    .address-option { display:flex; align-items:center; gap:14px; padding:14px; border:2px solid #E5E7EB; border-radius:12px; cursor:pointer; transition:all .2s; }
    .address-option input[type=radio] { display:none; }
    .address-option.selected { border-color:#E74C3C; background:#FEF2F2; }
    .addr-body { flex:1; display:flex; flex-direction:column; gap:2px; }
    .addr-body strong { font-size:14px; font-weight:600; color:#111; }
    .addr-body span { font-size:13px; color:#6B7280; }
    .check { color:#E74C3C; font-size:18px; font-weight:700; }
    .other-address-input { width:100%; box-sizing:border-box; border:2px solid #E5E7EB; border-radius:10px; padding:12px 14px; font-size:14px; outline:none; transition:border .2s; }
    .other-address-input:focus { border-color:#E74C3C; }

    /* Observations */
    .observations { width:100%; box-sizing:border-box; border:2px solid #E5E7EB; border-radius:10px; padding:12px 14px; font-size:14px; font-family:inherit; outline:none; resize:vertical; transition:border .2s; }
    .observations:focus { border-color:#E74C3C; }

    /* Summary */
    .summary-col { display:flex; flex-direction:column; gap:16px; }
    .summary-card { background:#fff; border-radius:16px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,.06); }
    .summary-rows { display:flex; flex-direction:column; gap:12px; margin-bottom:20px; }
    .sum-row { display:flex; justify-content:space-between; align-items:center; font-size:14px; color:#6B7280; }
    .sum-row .green { color:#16A34A; font-weight:600; }
    .sum-row.discount { color:#16A34A; }
    .sum-row.total { font-size:18px; font-weight:800; color:#111; padding-top:12px; border-top:2px solid #F3F4F6; margin-top:4px; }

    /* Promo */
    .promo-row { display:flex; gap:8px; margin-bottom:8px; }
    .promo-input { flex:1; border:2px solid #E5E7EB; border-radius:10px; padding:11px 14px; font-size:14px; outline:none; transition:border .2s; }
    .promo-input:focus { border-color:#E74C3C; }
    .promo-btn { padding:11px 16px; background:#111; color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap; }
    .promo-error { font-size:12px; color:#EF4444; margin:0 0 12px; }

    /* Payment */
    .payment-section { margin-bottom:20px; }
    .payment-section h3 { font-size:14px; font-weight:700; color:#111; margin:0 0 12px; }
    .payment-options { display:flex; flex-direction:column; gap:8px; }
    .payment-option { display:flex; align-items:center; gap:12px; padding:12px 14px; border:2px solid #E5E7EB; border-radius:10px; cursor:pointer; font-size:14px; transition:all .2s; }
    .payment-option input[type=radio] { display:none; }
    .payment-option.selected { border-color:#E74C3C; background:#FEF2F2; font-weight:600; color:#C0392B; }
    .pay-icon { font-size:20px; }

    .btn-checkout { width:100%; padding:16px; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:12px; transition:opacity .2s; }
    .btn-checkout:hover:not(:disabled) { opacity:.92; }
    .btn-checkout:disabled { opacity:.6; cursor:not-allowed; }
    .spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .secure-note { text-align:center; font-size:12px; color:#9CA3AF; margin:0; }

    .eta-card { background:#fff; border-radius:16px; padding:20px 24px; box-shadow:0 2px 12px rgba(0,0,0,.06); display:flex; align-items:center; gap:16px; }
    .eta-icon { font-size:32px; }
    .eta-card strong { font-size:14px; font-weight:700; color:#111; display:block; margin-bottom:2px; }
    .eta-card p { font-size:13px; color:#6B7280; margin:0; }

    @media(max-width:900px) {
      .cart-layout { grid-template-columns:1fr; }
    }
  `],
})
export class CartComponent {
  readonly cart    = inject(CartService);
  private orderSvc = inject(OrderService);
  private toast    = inject(ToastService);
  private router   = inject(Router);

  placing       = signal(false);
  selectedAddress = 1;
  selectedPayment = 'cash';
  customAddress   = '';
  observations    = '';
  promoInput      = '';
  promoCode       = '';
  promoError      = '';
  discount        = 0;
  deliveryFee     = 0;

  savedAddresses = [
    { id: 1, label: '🏠 Casa', address: 'Rua Comandante Gika, Luanda' },
    { id: 2, label: '🏢 Trabalho', address: 'Av. 4 de Fevereiro, Luanda' },
  ];

  paymentMethods = [
    { id: 'cash',       icon: '💵', label: 'Dinheiro na entrega' },
    { id: 'card',       icon: '💳', label: 'Cartão' },
    { id: 'online',     icon: '🌐', label: 'Pagamento online' },
    { id: 'multicaixa', icon: '📱', label: 'Multicaixa Express' },
  ];

  applyPromo(): void {
    const code = this.promoInput.trim().toUpperCase();
    if (code === 'PRONTOJA10') {
      this.discount  = Math.round(this.cart.subtotal() * 0.1);
      this.promoCode = code;
      this.promoError = '';
      this.toast.success('Código aplicado! 10% de desconto 🎉');
    } else {
      this.promoError = 'Código inválido ou expirado.';
      this.discount   = 0;
    }
  }

  placeOrder(): void {
    this.placing.set(true);
    const address = this.customAddress.trim()
      || (this.savedAddresses.find(a => a.id === this.selectedAddress)?.address ?? '');

    this.orderSvc.create({
      items:          this.cart.items(),
      deliveryAddress: address,
      paymentMethod:  this.selectedPayment,
      observations:   this.observations,
    }).subscribe({
      next: (order) => {
        this.cart.clear();
        this.toast.success('Pedido realizado com sucesso! 🎉');
        this.router.navigate(['/cliente/pedido', order.id]);
      },
      error: () => {
        this.toast.error('Erro ao realizar pedido. Tente novamente.');
        this.placing.set(false);
      },
    });
  }

  confirmClear(): void {
    if (confirm('Limpar todos os itens do carrinho?')) this.cart.clear();
  }

  productEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('frango') || lower.includes('muamba')) return '🍗';
    if (lower.includes('peixe') || lower.includes('calulu'))  return '🐟';
    if (lower.includes('pizza'))   return '🍕';
    if (lower.includes('hambúrg')) return '🍔';
    if (lower.includes('água'))    return '💧';
    if (lower.includes('sumo'))    return '🥤';
    return '🍽️';
  }
}
