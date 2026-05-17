export type UserRole = 'client' | 'restaurant' | 'delivery' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'blocked';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed';

export type PaymentMethod = 'cash' | 'card' | 'online' | 'multicaixa';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string | null;
  restaurantId?: number;
}

export interface Restaurant {
  id: number;
  userId: number;
  name: string;
  description?: string;
  logo?: string | null;
  coverImage?: string | null;
  category: string;
  address: string;
  phone: string;
  email?: string | null;
  deliveryFee: number;
  minOrderValue: number;
  minOrder: number;
  avgDeliveryTime: number;
  deliveryTime: number;
  rating: number;
  totalReviews: number;
  reviewCount: number;
  status: 'active' | 'inactive' | 'pending';
  isOpen: boolean;
}

export interface Category {
  id: number;
  restaurantId: number;
  name: string;
  description?: string;
  displayOrder?: number;
  status?: 'active' | 'inactive';
}

export interface Product {
  id: number;
  restaurantId: number;
  categoryId: number;
  name: string;
  description?: string;
  image?: string | null;
  price: number;
  promotionalPrice?: number | null;
  preparationTime?: number;
  status?: 'active' | 'inactive' | 'out_of_stock';
  isFeatured?: boolean;
  isHighlight?: boolean;
  isAvailable: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  clientId: number;
  restaurantId: number;
  restaurantName: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  deliveryAddress: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  items: OrderItem[];
}

export interface DeliveryRequest extends Order {
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  earnings: number;
  deliveryStatus: DeliveryStatus;
}
