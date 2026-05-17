import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { RestaurantService } from '../../../../core/services/restaurant.service';
import { CartService } from '../../../../core/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KzPipe } from '../../../../shared/pipes/kz.pipe';
import { Restaurant, Category, Product } from '../../../../core/models';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, KzPipe],
  template: `
    <app-navbar />

    @if (loading()) {
      <div class="loader-wrap"><div class="spinner-lg"></div></div>
    } @else if (restaurant()) {
      <!-- Cover -->
      <div class="cover" [style.background]="coverGradient()">
        <div class="cover-content">
          <a routerLink="/cliente/restaurantes" class="back-btn">← Voltar</a>
          <div class="rest-info">
            <div class="rest-emoji">{{ categoryEmoji(restaurant()!.category) }}</div>
            <div>
              <h1>{{ restaurant()!.name }}</h1>
              <p class="rest-desc">{{ restaurant()!.description }}</p>
              <div class="rest-chips">
                <span class="chip">⭐ {{ restaurant()!.rating }} ({{ restaurant()!.reviewCount }})</span>
                <span class="chip">🕐 {{ restaurant()!.deliveryTime }} min</span>
                <span class="chip">🚚 {{ restaurant()!.deliveryFee }} Kz</span>
                <span class="chip {{ restaurant()!.isOpen ? 'open' : 'closed' }}">
                  {{ restaurant()!.isOpen ? '● Aberto' : '● Fechado' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="page-layout">
        <!-- Sidebar — categories nav -->
        <aside class="cat-nav">
          <h3>Cardápio</h3>
          @for (cat of categories(); track cat.id) {
            <button class="cat-nav-item" [class.active]="activeCat() === cat.id"
              (click)="scrollTo(cat.id)">
              {{ cat.name }}
            </button>
          }
        </aside>

        <!-- Products -->
        <main class="menu-main">
          @for (cat of categories(); track cat.id) {
            <section [id]="'cat-' + cat.id" class="menu-section">
              <h2 class="cat-title">{{ cat.name }}</h2>
              <div class="products-grid">
                @for (p of productsByCategory(cat.id); track p.id) {
                  <div class="product-card" [class.unavailable]="!p.isAvailable">
                    <div class="product-img" [style.background]="productBg(p.id)">
                      <span>{{ productEmoji(p.name) }}</span>
                      @if (p.isHighlight) { <span class="highlight-badge">⭐ Destaque</span> }
                      @if (!p.isAvailable) { <div class="unavail-overlay">Indisponível</div> }
                    </div>
                    <div class="product-body">
                      <h4>{{ p.name }}</h4>
                      <p>{{ p.description }}</p>
                      <div class="product-footer">
                        <span class="price">{{ p.price | kz }}</span>
                        @if (p.isAvailable) {
                          <button class="add-btn" (click)="addToCart(p)"
                            [class.added]="justAdded() === p.id">
                            {{ justAdded() === p.id ? '✓ Adicionado' : '+ Adicionar' }}
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }
        </main>
      </div>

      <!-- Floating cart button -->
      @if (cart.totalItems() > 0) {
        <div class="floating-cart">
          <button class="floating-cart-btn" (click)="goToCart()">
            <span class="fc-badge">{{ cart.totalItems() }}</span>
            Ver Carrinho
            <span class="fc-total">{{ cart.subtotal() | kz }}</span>
          </button>
        </div>
      }
    }
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F9FAFB; min-height:100vh; }

    .loader-wrap { display:flex; justify-content:center; align-items:center; height:60vh; }
    .spinner-lg { width:48px; height:48px; border:4px solid #F3F4F6; border-top-color:#E74C3C; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Cover */
    .cover { padding:0; }
    .cover-content { max-width:1200px; margin:0 auto; padding:24px 24px 32px; }
    .back-btn { display:inline-block; color:#fff; text-decoration:none; font-weight:600; font-size:14px; margin-bottom:20px; opacity:.85; }
    .back-btn:hover { opacity:1; }
    .rest-info { display:flex; align-items:flex-start; gap:24px; }
    .rest-emoji { font-size:72px; line-height:1; }
    .rest-info h1 { font-size:32px; font-weight:900; color:#fff; margin:0 0 8px; }
    .rest-desc { color:rgba(255,255,255,.85); font-size:15px; margin:0 0 16px; max-width:500px; line-height:1.5; }
    .rest-chips { display:flex; flex-wrap:wrap; gap:8px; }
    .chip { background:rgba(255,255,255,.2); color:#fff; font-size:13px; font-weight:600; padding:5px 12px; border-radius:20px; backdrop-filter:blur(4px); }
    .chip.open   { background:rgba(22,163,74,.7); }
    .chip.closed { background:rgba(239,68,68,.7); }

    /* Layout */
    .page-layout { max-width:1200px; margin:0 auto; padding:32px 24px 100px; display:grid; grid-template-columns:200px 1fr; gap:32px; align-items:start; }

    /* Category nav */
    .cat-nav { position:sticky; top:80px; }
    .cat-nav h3 { font-size:14px; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:.5px; margin:0 0 12px; }
    .cat-nav-item { display:block; width:100%; text-align:left; padding:10px 14px; border:none; border-radius:8px; background:transparent; font-size:14px; font-weight:500; color:#374151; cursor:pointer; transition:all .2s; margin-bottom:4px; }
    .cat-nav-item:hover, .cat-nav-item.active { background:#FEF2F2; color:#C0392B; font-weight:600; }

    /* Menu */
    .menu-section { margin-bottom:40px; }
    .cat-title { font-size:20px; font-weight:800; color:#111; margin:0 0 16px; padding-bottom:12px; border-bottom:2px solid #F3F4F6; }
    .products-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }

    .product-card { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.06); transition:transform .2s; }
    .product-card:hover { transform:translateY(-2px); }
    .product-card.unavailable { opacity:.55; }
    .product-img { height:140px; display:flex; align-items:center; justify-content:center; position:relative; font-size:48px; }
    .highlight-badge { position:absolute; top:8px; left:8px; background:#F59E0B; color:#fff; font-size:11px; font-weight:700; padding:3px 8px; border-radius:20px; }
    .unavail-overlay { position:absolute; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:14px; }
    .product-body { padding:14px; }
    .product-body h4 { font-size:15px; font-weight:700; color:#111; margin:0 0 6px; }
    .product-body p  { font-size:13px; color:#6B7280; margin:0 0 14px; line-height:1.5; }
    .product-footer { display:flex; align-items:center; justify-content:space-between; }
    .price { font-size:16px; font-weight:800; color:#C0392B; }
    .add-btn { padding:8px 16px; background:#E74C3C; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
    .add-btn:hover { background:#C0392B; }
    .add-btn.added { background:#16A34A; }

    /* Floating cart */
    .floating-cart { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:200; }
    .floating-cart-btn { display:flex; align-items:center; gap:12px; background:#111; color:#fff; border:none; border-radius:50px; padding:16px 28px; font-size:15px; font-weight:700; cursor:pointer; box-shadow:0 8px 30px rgba(0,0,0,.3); transition:transform .2s; }
    .floating-cart-btn:hover { transform:translateY(-2px); }
    .fc-badge { background:#E74C3C; color:#fff; font-size:12px; font-weight:700; padding:2px 8px; border-radius:12px; }
    .fc-total { background:rgba(255,255,255,.15); padding:4px 10px; border-radius:8px; font-size:14px; }

    @media(max-width:768px) {
      .page-layout { grid-template-columns:1fr; }
      .cat-nav { position:static; display:flex; gap:8px; overflow-x:auto; }
      .cat-nav h3 { display:none; }
      .cat-nav-item { white-space:nowrap; }
      .rest-info { flex-direction:column; gap:12px; }
    }
  `],
})
export class RestaurantDetailComponent implements OnInit {
  @Input() id!: string;

  private svc    = inject(RestaurantService);
  private router = inject(Router);
  readonly cart  = inject(CartService);
  private toast  = inject(ToastService);

  restaurant  = signal<Restaurant | null>(null);
  categories  = signal<Category[]>([]);
  products    = signal<Product[]>([]);
  loading     = signal(true);
  activeCat   = signal<number>(0);
  justAdded   = signal<number | null>(null);

  ngOnInit(): void {
    const id = +this.id;
    this.svc.getById(id).subscribe(r => { this.restaurant.set(r); });
    this.svc.getMenu(id).subscribe(({ categories, products }) => {
      this.categories.set(categories);
      this.products.set(products);
      if (categories.length) this.activeCat.set(categories[0].id);
      this.loading.set(false);
    });
  }

  productsByCategory(catId: number): Product[] {
    return this.products().filter(p => p.categoryId === catId);
  }

  addToCart(product: Product): void {
    this.cart.add(product);
    this.justAdded.set(product.id);
    this.toast.success(`${product.name} adicionado ao carrinho`);
    setTimeout(() => this.justAdded.set(null), 1500);
  }

  goToCart(): void { this.router.navigate(['/cliente/carrinho']); }

  scrollTo(catId: number): void {
    this.activeCat.set(catId);
    document.getElementById('cat-' + catId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  coverGradient(): string {
    const id = this.restaurant()?.id ?? 1;
    const g = [
      'linear-gradient(135deg,#C0392B,#E67E22)',
      'linear-gradient(135deg,#1D4ED8,#7C3AED)',
      'linear-gradient(135deg,#065F46,#059669)',
      'linear-gradient(135deg,#92400E,#D97706)',
      'linear-gradient(135deg,#1E3A5F,#2563EB)',
      'linear-gradient(135deg,#4A044E,#BE185D)',
    ];
    return g[(id - 1) % g.length];
  }

  categoryEmoji(cat: string): string {
    const map: Record<string, string> = { 'Angolana':'🍲','Pizzaria':'🍕','Fast Food':'🍔','Cafeteria':'☕','Grelhados':'🥩','Japonesa':'🍣' };
    return map[cat] ?? '🍽️';
  }

  productEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('frango') || lower.includes('muamba')) return '🍗';
    if (lower.includes('peixe') || lower.includes('calulu')) return '🐟';
    if (lower.includes('banana')) return '🍌';
    if (lower.includes('camarão')) return '🦐';
    if (lower.includes('água')) return '💧';
    if (lower.includes('sumo') || lower.includes('múcua')) return '🥤';
    if (lower.includes('cocada')) return '🍮';
    return '🍽️';
  }

  productBg(id: number): string {
    const bg = ['#FFF7ED','#F0FDF4','#EFF6FF','#FDF4FF','#FFFBEB','#FEF2F2'];
    return bg[(id - 1) % bg.length];
  }
}
