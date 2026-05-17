import { Category, DeliveryRequest, Order, Product, Restaurant, User } from '../models';

export const RESTAURANT_CATEGORIES = [
  'Todas',
  'Angolana',
  'Pizzaria',
  'Fast Food',
  'Cafeteria',
  'Grelhados',
  'Japonesa',
  'Italiana',
];

export const MOCK_USERS: User[] = [
  { id: 1, name: 'Joao Cliente', email: 'joao@email.com', phone: '+244923000001', role: 'client', status: 'active' },
  { id: 2, name: 'Sabores de Angola', email: 'restaurante@prontoja.ao', phone: '+244923000002', role: 'restaurant', status: 'active', restaurantId: 1 },
  { id: 3, name: 'Carlos Entregador', email: 'entregador@prontoja.ao', phone: '+244923000003', role: 'delivery', status: 'active' },
  { id: 4, name: 'Administrador', email: 'admin@prontoja.ao', phone: '+244900000000', role: 'admin', status: 'active' },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  { id: 1, userId: 2, name: 'Sabores de Angola', description: 'Comida angolana caseira.', category: 'Angolana', address: 'Maianga, Luanda', phone: '+244923111111', deliveryFee: 900, minOrderValue: 2500, minOrder: 2500, avgDeliveryTime: 30, deliveryTime: 30, rating: 4.8, totalReviews: 128, reviewCount: 128, status: 'active', isOpen: true },
  { id: 2, userId: 5, name: 'Pizza Express', description: 'Pizzas artesanais e massas.', category: 'Pizzaria', address: 'Talatona, Luanda', phone: '+244923222222', deliveryFee: 0, minOrderValue: 3500, minOrder: 3500, avgDeliveryTime: 35, deliveryTime: 35, rating: 4.6, totalReviews: 94, reviewCount: 94, status: 'active', isOpen: true },
  { id: 3, userId: 6, name: 'Grillmaster', description: 'Grelhados, hamburguers e acompanhamentos.', category: 'Grelhados', address: 'Alvalade, Luanda', phone: '+244923333333', deliveryFee: 1200, minOrderValue: 3000, minOrder: 3000, avgDeliveryTime: 40, deliveryTime: 40, rating: 4.7, totalReviews: 88, reviewCount: 88, status: 'active', isOpen: true },
  { id: 4, userId: 7, name: 'Cantinho do Cafe', description: 'Pequenos almocos, cafes e sumos.', category: 'Cafeteria', address: 'Ingombota, Luanda', phone: '+244923444444', deliveryFee: 700, minOrderValue: 1800, minOrder: 1800, avgDeliveryTime: 25, deliveryTime: 25, rating: 4.5, totalReviews: 71, reviewCount: 71, status: 'active', isOpen: false },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, restaurantId: 1, name: 'Pratos Principais' },
  { id: 2, restaurantId: 1, name: 'Bebidas' },
  { id: 3, restaurantId: 2, name: 'Pizzas' },
  { id: 4, restaurantId: 3, name: 'Grelhados' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, restaurantId: 1, categoryId: 1, name: 'Muamba de Frango', description: 'Com funge e legumes.', price: 8000, preparationTime: 25, isAvailable: true, isHighlight: true, isFeatured: true, status: 'active' },
  { id: 2, restaurantId: 1, categoryId: 1, name: 'Calulu de Peixe', description: 'Peixe seco, legumes e funge.', price: 7000, preparationTime: 30, isAvailable: true, isHighlight: false, isFeatured: false, status: 'active' },
  { id: 3, restaurantId: 1, categoryId: 2, name: 'Sumo de Mucua', description: 'Natural e fresco.', price: 3000, preparationTime: 5, isAvailable: true, isHighlight: true, isFeatured: true, status: 'active' },
  { id: 4, restaurantId: 2, categoryId: 3, name: 'Pizza Marguerita', description: 'Molho de tomate, queijo e manjericao.', price: 6500, preparationTime: 20, isAvailable: true, isHighlight: false, status: 'active' },
  { id: 5, restaurantId: 3, categoryId: 4, name: 'Grelhado Misto', description: 'Carne, frango, batata e salada.', price: 11000, preparationTime: 35, isAvailable: true, isHighlight: true, status: 'active' },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 1041,
    orderNumber: 'PJ-1041',
    clientId: 1,
    restaurantId: 1,
    restaurantName: 'Sabores de Angola',
    customerName: 'Joao Cliente',
    customerPhone: '+244923000001',
    address: 'Rua Comandante Gika, Luanda',
    deliveryAddress: 'Rua Comandante Gika, Luanda',
    subtotal: 11000,
    deliveryFee: 900,
    discount: 0,
    total: 11900,
    status: 'pending',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    createdAt: new Date(),
    items: [
      { productId: 1, productName: 'Muamba de Frango', quantity: 1, unitPrice: 8000, subtotal: 8000 },
      { productId: 3, productName: 'Sumo de Mucua', quantity: 1, unitPrice: 3000, subtotal: 3000 },
    ],
  },
  {
    id: 1038,
    orderNumber: 'PJ-1038',
    clientId: 1,
    restaurantId: 2,
    restaurantName: 'Pizza Express',
    customerName: 'Joao Cliente',
    customerPhone: '+244923000001',
    address: 'Talatona, Luanda',
    deliveryAddress: 'Talatona, Luanda',
    subtotal: 6500,
    deliveryFee: 0,
    discount: 0,
    total: 6500,
    status: 'delivered',
    paymentMethod: 'multicaixa',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 86400000),
    items: [
      { productId: 4, productName: 'Pizza Marguerita', quantity: 1, unitPrice: 6500, subtotal: 6500 },
    ],
  },
];

export const MOCK_DELIVERIES: DeliveryRequest[] = MOCK_ORDERS.map((order) => ({
  ...order,
  pickupAddress: MOCK_RESTAURANTS.find((r) => r.id === order.restaurantId)?.address ?? 'Luanda',
  deliveryAddress: order.address,
  distanceKm: 4.2,
  earnings: order.deliveryFee || 900,
  deliveryStatus: order.status === 'delivered' ? 'delivered' : 'pending',
}));
