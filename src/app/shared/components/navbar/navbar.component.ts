import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <a routerLink="/cliente/inicio" class="nav-logo">
        <span>🍽️</span> ProntoJá
      </a>

      <div class="nav-links">
        <a routerLink="/cliente/inicio"      routerLinkActive="active">Início</a>
        <a routerLink="/cliente/restaurantes" routerLinkActive="active">Restaurantes</a>
        <a routerLink="/cliente/pedidos"      routerLinkActive="active">Pedidos</a>
      </div>

      <div class="nav-right">
        <a routerLink="/cliente/carrinho" class="cart-btn">
          🛒
          @if (cart.totalItems() > 0) {
            <span class="cart-badge">{{ cart.totalItems() }}</span>
          }
        </a>
        <a routerLink="/cliente/perfil" class="avatar-btn">
          {{ initial() }}
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position:sticky; top:0; z-index:100;
      display:flex; align-items:center; justify-content:space-between;
      padding:0 24px; height:64px;
      background:#fff; border-bottom:1px solid #F3F4F6;
      box-shadow:0 1px 10px rgba(0,0,0,.06);
      font-family:'Segoe UI',system-ui,sans-serif;
    }
    .nav-logo { display:flex; align-items:center; gap:8px; font-size:20px; font-weight:800; color:#C0392B; text-decoration:none; }
    .nav-links { display:flex; gap:4px; }
    .nav-links a { padding:8px 14px; border-radius:8px; text-decoration:none; color:#6B7280; font-size:14px; font-weight:500; transition:all .2s; }
    .nav-links a:hover, .nav-links a.active { background:#FEF2F2; color:#C0392B; }
    .nav-right { display:flex; align-items:center; gap:12px; }
    .cart-btn { position:relative; font-size:22px; text-decoration:none; cursor:pointer; }
    .cart-badge { position:absolute; top:-6px; right:-8px; background:#E74C3C; color:#fff; font-size:10px; font-weight:700; padding:2px 5px; border-radius:10px; min-width:16px; text-align:center; }
    .avatar-btn { width:36px; height:36px; border-radius:50%; background:#E74C3C; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; text-decoration:none; }
  `],
})
export class NavbarComponent {
  cart = inject(CartService);
  auth = inject(AuthService);
  initial() { return (this.auth.currentUser()?.name?.[0] ?? 'U').toUpperCase(); }
}
