import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { RestaurantService } from '../../../../core/services/restaurant.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Restaurant } from '../../../../core/models';
import { RESTAURANT_CATEGORIES } from '../../../../core/services/mock-data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  template: `
    <app-navbar />

    <div class="page">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <h1>Olá, {{ firstName() }} 👋</h1>
          <p>O que quer comer hoje?</p>
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch()"
              placeholder="Pesquisar restaurantes ou pratos…">
            @if (searchQuery) {
              <button class="clear-btn" (click)="clearSearch()">✕</button>
            }
          </div>
        </div>
        <div class="hero-visual">🍽️</div>
      </section>

      <!-- Categories -->
      <section class="section">
        <div class="categories-scroll">
          @for (cat of categories; track cat) {
            <button class="cat-chip" [class.active]="activeCategory === cat"
              (click)="selectCategory(cat)">
              {{ cat }}
            </button>
          }
        </div>
      </section>

      <!-- Restaurants -->
      <section class="section">
        <div class="section-header">
          <h2>{{ sectionTitle() }}</h2>
          <a routerLink="/cliente/restaurantes" class="see-all">Ver todos →</a>
        </div>

        @if (loading()) {
          <div class="grid">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="card-skeleton"></div>
            }
          </div>
        } @else if (restaurants().length === 0) {
          <div class="empty-state">
            <span>🔍</span>
            <p>Nenhum restaurante encontrado para "{{ searchQuery }}"</p>
          </div>
        } @else {
          <div class="grid">
            @for (r of restaurants(); track r.id) {
              <a [routerLink]="['/cliente/restaurante', r.id]" class="rest-card">
                <div class="card-cover" [style.background]="cardGradient(r.id)">
                  <span class="card-emoji">{{ categoryEmoji(r.category) }}</span>
                  @if (!r.isOpen) {
                    <div class="closed-badge">Fechado</div>
                  }
                  <div class="card-meta-overlay">
                    <span class="delivery-time">🕐 {{ r.deliveryTime }} min</span>
                  </div>
                </div>
                <div class="card-body">
                  <div class="card-header-row">
                    <h3>{{ r.name }}</h3>
                    <span class="rating">⭐ {{ r.rating }}</span>
                  </div>
                  <p class="card-category">{{ r.category }} · {{ r.address }}</p>
                  <div class="card-footer">
                    <span class="delivery-fee">
                      {{ r.deliveryFee === 0 ? '🎉 Grátis' : r.deliveryFee + ' Kz entrega' }}
                    </span>
                    <span class="min-order">Min: {{ r.minOrder }} Kz</span>
                  </div>
                </div>
              </a>
            }
          </div>
        }
      </section>

      <!-- Promo banner -->
      <section class="promo-banner">
        <div class="promo-text">
          <h3>Primeiro pedido?</h3>
          <p>Use o código <strong>PRONTOJA10</strong> e ganhe 10% de desconto!</p>
        </div>
        <div class="promo-emoji">🎁</div>
      </section>
    </div>
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F9FAFB; min-height:100vh; }
    .page { max-width:1200px; margin:0 auto; padding:0 24px 48px; }

    /* Hero */
    .hero {
      display:flex; align-items:center; justify-content:space-between;
      background:linear-gradient(135deg,#C0392B,#E74C3C 50%,#E67E22);
      border-radius:20px; padding:40px 48px; margin:24px 0 32px;
      color:#fff;
    }
    .hero h1 { font-size:32px; font-weight:800; margin:0 0 6px; }
    .hero p  { font-size:16px; margin:0 0 24px; opacity:.9; }
    .hero-visual { font-size:80px; opacity:.9; }
    .search-bar {
      display:flex; align-items:center; gap:10px;
      background:#fff; border-radius:12px; padding:0 16px;
      width:380px; max-width:100%;
    }
    .search-icon { font-size:18px; }
    .search-bar input { flex:1; border:none; outline:none; padding:14px 0; font-size:15px; background:transparent; }
    .clear-btn { background:none; border:none; cursor:pointer; color:#9CA3AF; font-size:16px; }

    /* Categories */
    .section { margin-bottom:32px; }
    .categories-scroll { display:flex; gap:10px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; }
    .categories-scroll::-webkit-scrollbar { display:none; }
    .cat-chip { padding:8px 18px; border-radius:20px; border:2px solid #E5E7EB; background:#fff; font-size:14px; font-weight:500; cursor:pointer; white-space:nowrap; transition:all .2s; color:#374151; }
    .cat-chip.active, .cat-chip:hover { background:#E74C3C; border-color:#E74C3C; color:#fff; }

    /* Grid */
    .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
    .section-header h2 { font-size:22px; font-weight:800; color:#111; margin:0; }
    .see-all { font-size:14px; color:#E74C3C; text-decoration:none; font-weight:600; }
    .see-all:hover { text-decoration:underline; }

    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; }

    /* Restaurant Card */
    .rest-card { text-decoration:none; border-radius:16px; background:#fff; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.06); transition:transform .2s, box-shadow .2s; display:block; }
    .rest-card:hover { transform:translateY(-4px); box-shadow:0 8px 28px rgba(0,0,0,.12); }
    .card-cover { height:160px; position:relative; display:flex; align-items:center; justify-content:center; }
    .card-emoji { font-size:52px; }
    .closed-badge { position:absolute; top:12px; left:12px; background:rgba(0,0,0,.7); color:#fff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; }
    .card-meta-overlay { position:absolute; bottom:10px; right:12px; }
    .delivery-time { background:rgba(0,0,0,.6); color:#fff; font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; }
    .card-body { padding:16px; }
    .card-header-row { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px; }
    .card-header-row h3 { font-size:16px; font-weight:700; color:#111; margin:0; }
    .rating { font-size:14px; font-weight:600; color:#F59E0B; white-space:nowrap; }
    .card-category { font-size:13px; color:#6B7280; margin:0 0 12px; }
    .card-footer { display:flex; justify-content:space-between; align-items:center; }
    .delivery-fee { font-size:13px; font-weight:600; color:#16A34A; }
    .min-order { font-size:12px; color:#9CA3AF; }

    /* Skeleton */
    .card-skeleton { height:260px; background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%); background-size:200% 100%; border-radius:16px; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Empty */
    .empty-state { text-align:center; padding:60px 20px; }
    .empty-state span { font-size:48px; display:block; margin-bottom:12px; }
    .empty-state p { color:#6B7280; font-size:16px; }

    /* Promo */
    .promo-banner { display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg,#1D4ED8,#7C3AED); border-radius:16px; padding:28px 36px; color:#fff; margin-top:8px; }
    .promo-text h3 { font-size:20px; font-weight:800; margin:0 0 6px; }
    .promo-text p  { font-size:15px; margin:0; opacity:.9; }
    .promo-emoji { font-size:52px; }

    @media(max-width:768px) {
      .hero { padding:28px 24px; flex-direction:column; gap:16px; text-align:center; }
      .hero-visual { display:none; }
      .search-bar { width:100%; }
      .grid { grid-template-columns:1fr; }
    }
  `],
})
export class HomeComponent implements OnInit {
  private restaurantSvc = inject(RestaurantService);
  private authSvc       = inject(AuthService);

  restaurants = signal<Restaurant[]>([]);
  loading     = signal(true);
  searchQuery = '';
  activeCategory = 'Todas';
  categories  = RESTAURANT_CATEGORIES;

  firstName = () => this.authSvc.currentUser()?.name?.split(' ')[0] ?? 'Utilizador';
  sectionTitle = () => this.activeCategory === 'Todas' ? 'Restaurantes Disponíveis' : this.activeCategory;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.restaurantSvc.getAll(this.searchQuery || undefined, this.activeCategory).subscribe(data => {
      this.restaurants.set(data);
      this.loading.set(false);
    });
  }

  onSearch(): void { this.load(); }
  clearSearch(): void { this.searchQuery = ''; this.load(); }
  selectCategory(cat: string): void { this.activeCategory = cat; this.load(); }

  cardGradient(id: number): string {
    const g = [
      'linear-gradient(135deg,#FFDEE9,#B5FFFC)',
      'linear-gradient(135deg,#FEE3A1,#FFAFBD)',
      'linear-gradient(135deg,#A8EDEA,#FED6E3)',
      'linear-gradient(135deg,#D4FC79,#96E6A1)',
      'linear-gradient(135deg,#FBC2EB,#A6C1EE)',
      'linear-gradient(135deg,#FDDB92,#D1FDFF)',
    ];
    return g[(id - 1) % g.length];
  }

  categoryEmoji(cat: string): string {
    const map: Record<string, string> = {
      'Angolana':'🍲','Pizzaria':'🍕','Fast Food':'🍔','Cafeteria':'☕',
      'Grelhados':'🥩','Japonesa':'🍣','Chinesa':'🥢','Italiana':'🍝',
    };
    return map[cat] ?? '🍽️';
  }
}
