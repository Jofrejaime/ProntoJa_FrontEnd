import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'cliente/inicio' },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'auth/recover',
    loadComponent: () => import('./features/auth/pages/recover/recover.component').then((m) => m.RecoverComponent),
  },
  {
    path: 'cliente/inicio',
    loadComponent: () => import('./features/client/pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'cliente/restaurantes',
    loadComponent: () => import('./features/client/pages/restaurants/restaurants.component').then((m) => m.RestaurantsComponent),
  },
  {
    path: 'cliente/restaurante/:id',
    loadComponent: () => import('./features/client/pages/restaurant-detail/restaurant-detail.component').then((m) => m.RestaurantDetailComponent),
  },
  {
    path: 'cliente/carrinho',
    loadComponent: () => import('./features/client/pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'cliente/pedidos',
    loadComponent: () => import('./features/client/pages/orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: 'cliente/pedido/:id',
    loadComponent: () => import('./features/client/pages/orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: 'cliente/perfil',
    loadComponent: () => import('./features/client/pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'restaurante/dashboard',
    loadComponent: () => import('./features/restaurant/pages/dashboard/restaurant-dashboard.component').then((m) => m.RestaurantDashboardComponent),
  },
  {
    path: 'restaurante/pedidos',
    loadComponent: () => import('./features/restaurant/pages/orders/restaurant-orders.component').then((m) => m.RestaurantOrdersComponent),
  },
  {
    path: 'restaurante/cardapio',
    loadComponent: () => import('./features/restaurant/pages/menu/restaurant-menu.component').then((m) => m.RestaurantMenuComponent),
  },
  {
    path: 'entregador/dashboard',
    loadComponent: () => import('./features/delivery/pages/dashboard/delivery-dashboard.component').then((m) => m.DeliveryDashboardComponent),
  },
  { path: '**', redirectTo: 'cliente/inicio' },
];
