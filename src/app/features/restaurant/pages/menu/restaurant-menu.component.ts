import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestaurantService } from '../../../../core/services/restaurant.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KzPipe } from '../../../../shared/pipes/kz.pipe';
import { Category, Product } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-restaurant-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, KzPipe],
  template: `
    <div class="dashboard-wrap">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="brand"><span>🍽️</span><span class="brand-name">ProntoJá</span></div>
        <p class="brand-role">Painel Restaurante</p>
        <nav class="nav">
          <a routerLink="/restaurante/dashboard" class="nav-item">📊 Visão Geral</a>
          <a routerLink="/restaurante/pedidos"   class="nav-item">📋 Pedidos</a>
          <a routerLink="/restaurante/cardapio"  class="nav-item active">🍽️ Cardápio</a>
          <a routerLink="/restaurante/perfil"    class="nav-item">⚙️ Configurações</a>
        </nav>
      </aside>

      <main class="main">
        <div class="main-header">
          <div>
            <h1>Gestão do Cardápio</h1>
            <p>{{ totalProducts() }} produto{{ totalProducts() !== 1 ? 's' : '' }} em {{ categories().length }} categoria{{ categories().length !== 1 ? 's' : '' }}</p>
          </div>
          <button class="btn-primary" (click)="openProductModal()">+ Novo Produto</button>
        </div>

        <div class="menu-layout">
          <!-- Category sidebar -->
          <div class="cat-panel">
            <div class="cat-panel-header">
              <h3>Categorias</h3>
              <button class="btn-add-cat" (click)="openCategoryModal()">+</button>
            </div>
            <div class="cat-list">
              <button class="cat-item" [class.active]="activeCatId() === null"
                (click)="activeCatId.set(null)">
                📋 Todos <span class="cat-count">{{ totalProducts() }}</span>
              </button>
              @for (cat of categories(); track cat.id) {
                <button class="cat-item" [class.active]="activeCatId() === cat.id"
                  (click)="activeCatId.set(cat.id)">
                  {{ cat.name }}
                  <span class="cat-count">{{ countByCat(cat.id) }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Products list -->
          <div class="products-panel">
            @if (filteredProducts().length === 0) {
              <div class="empty-state">
                <span>🍽️</span>
                <p>Nenhum produto nesta categoria.</p>
                <button class="btn-primary" (click)="openProductModal()">Adicionar Produto</button>
              </div>
            } @else {
              <div class="products-table">
                <div class="table-head">
                  <span>Produto</span>
                  <span>Categoria</span>
                  <span>Preço</span>
                  <span>Estado</span>
                  <span>Acções</span>
                </div>
                @for (p of filteredProducts(); track p.id) {
                  <div class="table-row">
                    <div class="prod-info">
                      <div class="prod-emoji">{{ productEmoji(p.name) }}</div>
                      <div>
                        <strong>{{ p.name }}</strong>
                        <p>{{ p.description }}</p>
                        @if (p.isHighlight) { <span class="highlight-tag">⭐ Destaque</span> }
                      </div>
                    </div>
                    <span class="cat-tag">{{ categoryName(p.categoryId) }}</span>
                    <span class="price">{{ p.price | kz }}</span>
                    <div>
                      <button class="toggle-avail" [class.on]="p.isAvailable"
                        (click)="toggleAvailability(p)">
                        <span class="toggle-knob"></span>
                      </button>
                    </div>
                    <div class="row-actions">
                      <button class="icon-btn" (click)="openProductModal(p)" title="Editar">✏️</button>
                      <button class="icon-btn danger" (click)="deleteProduct(p.id)" title="Eliminar">🗑️</button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </main>
    </div>

    <!-- Product Modal -->
    @if (showProductModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingProduct ? 'Editar Produto' : 'Novo Produto' }}</h2>
            <button class="modal-close" (click)="closeModals()">✕</button>
          </div>
          <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="modal-form">
            <div class="field">
              <label>Nome do produto</label>
              <input type="text" formControlName="name" placeholder="Ex: Muamba de Frango">
            </div>
            <div class="field">
              <label>Descrição</label>
              <textarea formControlName="description" rows="2" placeholder="Descrição breve do produto…"></textarea>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Preço (Kz)</label>
                <input type="number" formControlName="price" placeholder="0">
              </div>
              <div class="field">
                <label>Categoria</label>
                <select formControlName="categoryId">
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="field checkbox-field">
              <label>
                <input type="checkbox" formControlName="isHighlight"> Marcar como destaque ⭐
              </label>
              <label>
                <input type="checkbox" formControlName="isAvailable"> Produto disponível
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeModals()">Cancelar</button>
              <button type="submit" class="btn-save" [disabled]="saving()">
                {{ saving() ? 'A guardar…' : (editingProduct ? 'Guardar alterações' : 'Criar produto') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Category Modal -->
    @if (showCategoryModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Nova Categoria</h2>
            <button class="modal-close" (click)="closeModals()">✕</button>
          </div>
          <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()" class="modal-form">
            <div class="field">
              <label>Nome da categoria</label>
              <input type="text" formControlName="name" placeholder="Ex: Entradas, Sobremesas…">
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeModals()">Cancelar</button>
              <button type="submit" class="btn-save">Criar categoria</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display:block; font-family:'Segoe UI',system-ui,sans-serif; background:#F1F5F9; min-height:100vh; }
    .dashboard-wrap { display:grid; grid-template-columns:240px 1fr; min-height:100vh; }

    .sidebar { background:#fff; border-right:1px solid #E5E7EB; display:flex; flex-direction:column; padding:24px 16px; position:sticky; top:0; height:100vh; }
    .brand { display:flex; align-items:center; gap:8px; font-size:20px; font-weight:800; color:#C0392B; margin-bottom:4px; }
    .brand-name { }
    .brand-role { font-size:11px; color:#9CA3AF; text-transform:uppercase; letter-spacing:.5px; margin:0 0 32px 32px; }
    .nav { display:flex; flex-direction:column; gap:4px; }
    .nav-item { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:10px; text-decoration:none; font-size:14px; font-weight:500; color:#374151; transition:all .2s; }
    .nav-item:hover, .nav-item.active { background:#FEF2F2; color:#C0392B; font-weight:600; }

    .main { padding:32px; }
    .main-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; }
    .main-header h1 { font-size:26px; font-weight:800; color:#111; margin:0 0 4px; }
    .main-header p  { font-size:14px; color:#6B7280; margin:0; }
    .btn-primary { padding:11px 20px; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; white-space:nowrap; }
    .btn-primary:hover { opacity:.9; }

    /* Layout */
    .menu-layout { display:grid; grid-template-columns:200px 1fr; gap:20px; }

    /* Category panel */
    .cat-panel { background:#fff; border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.05); height:fit-content; }
    .cat-panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .cat-panel-header h3 { font-size:14px; font-weight:700; color:#111; margin:0; }
    .btn-add-cat { width:28px; height:28px; border-radius:50%; background:#F3F4F6; border:none; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .btn-add-cat:hover { background:#FEF2F2; color:#E74C3C; }
    .cat-list { display:flex; flex-direction:column; gap:4px; }
    .cat-item { display:flex; align-items:center; justify-content:space-between; padding:9px 12px; border:none; border-radius:8px; background:transparent; font-size:13px; font-weight:500; color:#374151; cursor:pointer; text-align:left; transition:all .2s; }
    .cat-item:hover, .cat-item.active { background:#FEF2F2; color:#C0392B; font-weight:600; }
    .cat-count { background:#F3F4F6; color:#6B7280; font-size:11px; font-weight:700; padding:2px 7px; border-radius:10px; }
    .cat-item.active .cat-count { background:rgba(231,76,60,.15); color:#C0392B; }

    /* Products */
    .products-panel { background:#fff; border-radius:16px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
    .empty-state { text-align:center; padding:60px; }
    .empty-state span { font-size:40px; display:block; margin-bottom:12px; }
    .empty-state p { color:#9CA3AF; font-size:15px; margin:0 0 20px; }

    /* Table */
    .table-head { display:grid; grid-template-columns:2fr 1fr .8fr .6fr .5fr; gap:12px; padding:10px 16px; font-size:12px; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:.3px; border-bottom:1px solid #F3F4F6; }
    .table-row { display:grid; grid-template-columns:2fr 1fr .8fr .6fr .5fr; gap:12px; padding:14px 16px; align-items:center; border-bottom:1px solid #F9FAFB; transition:background .15s; }
    .table-row:hover { background:#F9FAFB; border-radius:10px; }
    .prod-info { display:flex; align-items:center; gap:12px; }
    .prod-emoji { width:44px; height:44px; border-radius:10px; background:#F3F4F6; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
    .prod-info strong { font-size:14px; font-weight:600; color:#111; display:block; }
    .prod-info p { font-size:12px; color:#9CA3AF; margin:0 0 4px; }
    .highlight-tag { font-size:11px; background:#FEF3C7; color:#92400E; padding:2px 8px; border-radius:10px; }
    .cat-tag { font-size:12px; color:#6B7280; background:#F3F4F6; padding:4px 10px; border-radius:20px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .price { font-size:14px; font-weight:700; color:#111; }

    /* Toggle */
    .toggle-avail { position:relative; width:40px; height:22px; border-radius:11px; border:none; background:#E5E7EB; cursor:pointer; transition:background .3s; }
    .toggle-avail.on { background:#16A34A; }
    .toggle-knob { position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .3s; box-shadow:0 1px 3px rgba(0,0,0,.2); display:block; }
    .toggle-avail.on .toggle-knob { transform:translateX(18px); }

    .row-actions { display:flex; gap:4px; }
    .icon-btn { background:none; border:none; font-size:16px; cursor:pointer; opacity:.5; padding:4px; transition:opacity .2s; }
    .icon-btn:hover { opacity:1; }

    /* Modal */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:24px; }
    .modal { background:#fff; border-radius:20px; width:100%; max-width:520px; box-shadow:0 20px 60px rgba(0,0,0,.2); }
    .modal.modal-sm { max-width:380px; }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:24px 28px 0; margin-bottom:24px; }
    .modal-header h2 { font-size:20px; font-weight:800; color:#111; margin:0; }
    .modal-close { background:none; border:none; font-size:20px; cursor:pointer; color:#9CA3AF; }

    .modal-form { padding:0 28px 28px; display:flex; flex-direction:column; gap:16px; }
    .field { display:flex; flex-direction:column; gap:6px; }
    .field label { font-size:13px; font-weight:600; color:#374151; }
    .field input, .field textarea, .field select { padding:12px 14px; border:2px solid #E5E7EB; border-radius:10px; font-size:14px; font-family:inherit; outline:none; transition:border .2s; box-sizing:border-box; width:100%; }
    .field input:focus, .field textarea:focus, .field select:focus { border-color:#E74C3C; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .checkbox-field { flex-direction:row; flex-wrap:wrap; gap:14px; }
    .checkbox-field label { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; cursor:pointer; }
    .checkbox-field input[type=checkbox] { width:auto; }

    .modal-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:8px; }
    .btn-cancel { padding:11px 18px; background:#F3F4F6; border:none; border-radius:10px; font-size:14px; cursor:pointer; }
    .btn-save { padding:11px 20px; background:linear-gradient(135deg,#C0392B,#E74C3C); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; }
    .btn-save:disabled { opacity:.6; cursor:not-allowed; }

    @media(max-width:768px) { .dashboard-wrap { grid-template-columns:1fr; } .sidebar { display:none; } .menu-layout { grid-template-columns:1fr; } .table-head { display:none; } .table-row { grid-template-columns:1fr auto; } }
  `],
})
export class RestaurantMenuComponent implements OnInit {
  private svc   = inject(RestaurantService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);

  categories    = signal<Category[]>([]);
  products      = signal<Product[]>([]);
  activeCatId   = signal<number | null>(null);
  showProductModal  = signal(false);
  showCategoryModal = signal(false);
  saving        = signal(false);
  editingProduct: Product | null = null;

  productForm = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    price:       [0, [Validators.required, Validators.min(1)]],
    categoryId:  [null as number | null, Validators.required],
    isHighlight: [false],
    isAvailable: [true],
  });

  categoryForm = this.fb.group({ name: ['', Validators.required] });

  ngOnInit(): void {
    const restId = this.auth.currentUser()?.restaurantId ?? 1;
    this.svc.getMenu(restId).subscribe(({ categories, products }) => {
      this.categories.set(categories);
      this.products.set(products);
    });
  }

  filteredProducts(): Product[] {
    const id = this.activeCatId();
    return id === null ? this.products() : this.products().filter(p => p.categoryId === id);
  }

  totalProducts(): number { return this.products().length; }
  countByCat(id: number): number { return this.products().filter(p => p.categoryId === id).length; }
  categoryName(id: number): string { return this.categories().find(c => c.id === id)?.name ?? '—'; }

  openProductModal(p?: Product): void {
    this.editingProduct = p ?? null;
    this.productForm.reset({ isAvailable: true, isHighlight: false });
    if (p) this.productForm.patchValue({ ...p } as any);
    this.showProductModal.set(true);
  }

  openCategoryModal(): void { this.categoryForm.reset(); this.showCategoryModal.set(true); }
  closeModals(): void { this.showProductModal.set(false); this.showCategoryModal.set(false); }

  saveProduct(): void {
    if (this.productForm.invalid) { this.productForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.productForm.value;
    setTimeout(() => {
      if (this.editingProduct) {
        this.products.update(list => list.map(p => p.id === this.editingProduct!.id ? { ...p, ...val } as Product : p));
        this.toast.success('Produto actualizado!');
      } else {
        const newProduct = { ...val, id: Date.now() } as Product;
        this.products.update(list => [...list, newProduct]);
        this.toast.success('Produto criado!');
      }
      this.saving.set(false);
      this.closeModals();
    }, 700);
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;
    const newCat: Category = { id: Date.now(), name: this.categoryForm.value.name!, restaurantId: 1 };
    this.categories.update(list => [...list, newCat]);
    this.toast.success('Categoria criada!');
    this.closeModals();
  }

  toggleAvailability(p: Product): void {
    this.products.update(list => list.map(pr => pr.id === p.id ? { ...pr, isAvailable: !pr.isAvailable } : pr));
  }

  deleteProduct(id: number): void {
    if (!confirm('Eliminar este produto?')) return;
    this.products.update(list => list.filter(p => p.id !== id));
    this.toast.success('Produto eliminado.');
  }

  productEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('frango') || lower.includes('muamba')) return '🍗';
    if (lower.includes('peixe') || lower.includes('calulu'))  return '🐟';
    if (lower.includes('pizza'))   return '🍕';
    if (lower.includes('hambúrg')) return '🍔';
    if (lower.includes('sumo'))    return '🥤';
    if (lower.includes('água'))    return '💧';
    return '🍽️';
  }
}
