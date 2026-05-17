import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { RestaurantService } from '../../../../core/services/restaurant.service';
import { Restaurant } from '../../../../core/models';
import { RESTAURANT_CATEGORIES } from '../../../../core/services/mock-data';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  template: `
    <app-navbar />

    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Todos os Restaurantes</h1>
          <p>{{ restaurants().length }} restaurante{{ restaurants().length !== 1 ? 's' : '' }} disponíveis</p>
        </div>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch()"
            placeholder="Pesquisar restaurantes…">
          @if (searchQuery) {
            <button class="clear-btn" (click)="clearSearch()">✕</button>
          }
        </div>
      </div>

      <!-- Filters row -->
      <div class="filters-row">
        <div class="categories-scroll">
          @for (cat of categories; track cat) {
            <button class="cat-chip" [class.active]="activeCategory === cat"
              (click)="selectCategory(cat)">
              {{ categoryEmoji(cat) }} {{ cat }}
            </button>
          }
        </div>
        <div class="sort-select">
          <select [(ngModel)]="sortBy" (ngModelChange)="onSort()">
            <option value="default">Ordenar por</option>
            <option value="rating">Melhor avaliação</option>
            <option value="delivery">Menor entrega</option>
            <option value="time">Entrega mais rápida</option>
          </select>
        </div>
      </div>

      <!-- Status tabs -->
      <div class="status-tabs">
        <button class="tab" [class.active]="showOpen === null" (click)="showOpen = null; load()">Todos</button>
        <button class="tab" [class.active]="showOpen === true"  (click)="showOpen = true;  load()">Abertos agora</button>
        <button class="tab" [class.active]="showOpen === false" (click)="showOpen = false; load()">Fechados</button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="grid">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="card-skeleton"></div>
          }
        </div>
      }
      <!-- Empty -->
      @else if (restaurants().length === 0) {
        <div class="empty-state">
          <span>🔍</span>
          <h3>Nenhum resultado</h3>
          <p>Tente ajustar os filtros ou pesquisar outro termo.</p>
          <button class="reset-btn" (click)="resetFilters()">Limpar filtros</button>
        </div>
      }
      <!-- Grid -->
      @else {
        <div class="grid">
          @for (r of restaurants(); track r.id) {
            <a [routerLink]="['/cliente/restaurante', r.id]" class="rest-card">
              <div class="card-cover" [style.background]="cardGradient(r.id)">
                <span class="card-emoji">{{ categoryEmoji(r.category) }}</span>
                @if (!r.isOpen) {
                  <div class="closed-badge">Fechado</div>
                }
                @if (r.deliveryFee === 0) {
                  <div class="free-badge">🎉 Entrega Grátis</div>
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
                <p class="card-category">{{ r.category }}</p>
                <p class="card-address">📍 {{ r.address }}</p>
                <div class="card-footer">
                  <span class="delivery-fee">
                    {{ r.deliveryFee === 0 ? 'Grátis' : r.deliveryFee + ' Kz' }}
                  </span>
                  <span class="min-order">Mínimo: {{ r.minOrder }} Kz</span>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F9FAFB; min-height:100vh; }
    .page { max-width:1200px; margin:0 auto; padding:32px 24px 64px; }

    /* Header */
    .page-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:28px; }
    .page-header h1 { font-size:28px; font-weight:800; color:#111; margin:0 0 4px; }
    .page-header p  { font-size:14px; color:#6B7280; margin:0; }
    .search-bar { display:flex; align-items:center; gap:10px; background:#fff; border:2px solid #E5E7EB; border-radius:12px; padding:0 16px; width:320px; max-width:100%; }
    .search-icon { font-size:16px; }
    .search-bar input { flex:1; border:none; outline:none; padding:12px 0; font-size:14px; background:transparent; }
    .clear-btn { background:none; border:none; cursor:pointer; color:#9CA3AF; font-size:15px; }

    /* Filters */
    .filters-row { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
    .categories-scroll { display:flex; gap:8px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; flex:1; }
    .categories-scroll::-webkit-scrollbar { display:none; }
    .cat-chip { padding:7px 14px; border-radius:20px; border:2px solid #E5E7EB; background:#fff; font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; transition:all .2s; color:#374151; }
    .cat-chip.active, .cat-chip:hover { background:#E74C3C; border-color:#E74C3C; color:#fff; }

    .sort-select select { border:2px solid #E5E7EB; border-radius:10px; padding:9px 14px; font-size:14px; color:#374151; background:#fff; cursor:pointer; outline:none; }
    .sort-select select:focus { border-color:#E74C3C; }

    /* Tabs */
    .status-tabs { display:flex; gap:4px; margin-bottom:28px; background:#F3F4F6; border-radius:10px; padding:4px; width:fit-content; }
    .tab { padding:8px 20px; border:none; border-radius:8px; background:transparent; font-size:14px; font-weight:500; color:#6B7280; cursor:pointer; transition:all .2s; }
    .tab.active { background:#fff; color:#111; font-weight:700; box-shadow:0 1px 4px rgba(0,0,0,.08); }

    /* Grid */
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }

    /* Card */
    .rest-card { text-decoration:none; border-radius:16px; background:#fff; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.06); transition:transform .2s,box-shadow .2s; display:block; }
    .rest-card:hover { transform:translateY(-4px); box-shadow:0 8px 28px rgba(0,0,0,.12); }
    .card-cover { height:160px; position:relative; display:flex; align-items:center; justify-content:center; }
    .card-emoji { font-size:52px; }
    .closed-badge { position:absolute; top:12px; left:12px; background:rgba(0,0,0,.7); color:#fff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; }
    .free-badge { position:absolute; top:12px; left:12px; background:rgba(22,163,74,.9); color:#fff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; }
    .card-meta-overlay { position:absolute; bottom:10px; right:12px; }
    .delivery-time { background:rgba(0,0,0,.6); color:#fff; font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; }
    .card-body { padding:16px; }
    .card-header-row { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px; }
    .card-header-row h3 { font-size:16px; font-weight:700; color:#111; margin:0; }
    .rating { font-size:14px; font-weight:600; color:#F59E0B; white-space:nowrap; }
    .card-category { font-size:13px; color:#6B7280; margin:0 0 4px; font-weight:500; }
    .card-address { font-size:12px; color:#9CA3AF; margin:0 0 12px; }
    .card-footer { display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid #F3F4F6; }
    .delivery-fee { font-size:13px; font-weight:600; color:#16A34A; }
    .min-order { font-size:12px; color:#9CA3AF; }

    /* Skeleton */
    .card-skeleton { height:280px; background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%); background-size:200% 100%; border-radius:16px; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Empty */
    .empty-state { text-align:center; padding:80px 20px; }
    .empty-state span { font-size:56px; display:block; margin-bottom:16px; }
    .empty-state h3 { font-size:20px; font-weight:700; color:#111; margin:0 0 8px; }
    .empty-state p { color:#6B7280; font-size:15px; margin:0 0 24px; }
    .reset-btn { padding:11px 24px; background:#E74C3C; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; }

    @media(max-width:768px) {
      .page-header { flex-direction:column; align-items:flex-start; }
      .search-bar { width:100%; }
      .grid { grid-template-columns:1fr; }
    }
  `],
})
export class RestaurantsComponent implements OnInit {
  private restaurantSvc = inject(RestaurantService);

  restaurants    = signal<Restaurant[]>([]);
  loading        = signal(true);
  searchQuery    = '';
  activeCategory = 'Todas';
  sortBy         = 'default';
  showOpen: boolean | null = null;
  categories     = RESTAURANT_CATEGORIES;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.restaurantSvc.getAll(this.searchQuery || undefined, this.activeCategory).subscribe(data => {
      let result = data;
      if (this.showOpen !== null) result = result.filter(r => r.isOpen === this.showOpen);
      if (this.sortBy === 'rating')   result = [...result].sort((a, b) => b.rating - a.rating);
      if (this.sortBy === 'delivery') result = [...result].sort((a, b) => a.deliveryFee - b.deliveryFee);
      if (this.sortBy === 'time')     result = [...result].sort((a, b) => a.deliveryTime - b.deliveryTime);
      this.restaurants.set(result);
      this.loading.set(false);
    });
  }

  onSearch(): void { this.load(); }
  onSort():   void { this.load(); }
  clearSearch():   void { this.searchQuery = ''; this.load(); }
  selectCategory(cat: string): void { this.activeCategory = cat; this.load(); }
  resetFilters(): void { this.searchQuery = ''; this.activeCategory = 'Todas'; this.sortBy = 'default'; this.showOpen = null; this.load(); }

  cardGradient(id: number): string {
    const g = ['linear-gradient(135deg,#FFDEE9,#B5FFFC)','linear-gradient(135deg,#FEE3A1,#FFAFBD)','linear-gradient(135deg,#A8EDEA,#FED6E3)','linear-gradient(135deg,#D4FC79,#96E6A1)','linear-gradient(135deg,#FBC2EB,#A6C1EE)','linear-gradient(135deg,#FDDB92,#D1FDFF)'];
    return g[(id - 1) % g.length];
  }

  categoryEmoji(cat: string): string {
    const map: Record<string, string> = { 'Todas':'🍽️','Angolana':'🍲','Pizzaria':'🍕','Fast Food':'🍔','Cafeteria':'☕','Grelhados':'🥩','Japonesa':'🍣','Chinesa':'🥢','Italiana':'🍝' };
    return map[cat] ?? '🍽️';
  }
}
