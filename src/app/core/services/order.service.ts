import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { CartItem, DeliveryRequest, Order, OrderStatus, PaymentMethod } from '../models';
import { MOCK_DELIVERIES, MOCK_ORDERS, MOCK_RESTAURANTS } from './mock-data';

interface CreateOrderPayload {
  items: CartItem[];
  deliveryAddress: string;
  paymentMethod: string;
  observations?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly orders = signal<Order[]>([...MOCK_ORDERS]);
  private readonly deliveries = signal<DeliveryRequest[]>([...MOCK_DELIVERIES]);

  create(payload: CreateOrderPayload): Observable<Order> {
    const firstItem = payload.items[0];
    const restaurantId = firstItem?.product.restaurantId ?? 1;
    const restaurant = MOCK_RESTAURANTS.find((item) => item.id === restaurantId) ?? MOCK_RESTAURANTS[0];
    const subtotal = payload.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
    const deliveryFee = restaurant.deliveryFee;

    const order: Order = {
      id: Date.now(),
      orderNumber: `PJ-${Math.floor(Math.random() * 9000) + 1000}`,
      clientId: 1,
      restaurantId,
      restaurantName: restaurant.name,
      customerName: 'Joao Cliente',
      customerPhone: '+244923000001',
      address: payload.deliveryAddress,
      deliveryAddress: payload.deliveryAddress,
      subtotal,
      deliveryFee,
      discount: 0,
      total: subtotal + deliveryFee,
      status: 'pending',
      paymentMethod: this.normalizePaymentMethod(payload.paymentMethod),
      paymentStatus: 'pending',
      notes: payload.observations,
      createdAt: new Date(),
      items: payload.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: item.product.price * item.quantity,
        notes: item.notes,
      })),
    };

    return of(order).pipe(
      delay(600),
      tap((createdOrder) => this.orders.update((orders) => [createdOrder, ...orders])),
    );
  }

  getHistory(): Observable<Order[]> {
    return of(this.orders()).pipe(delay(250));
  }

  getRestaurantOrders(): Observable<Order[]> {
    return of(this.orders()).pipe(delay(250));
  }

  updateStatus(orderId: number, status: string): Observable<Order | undefined> {
    const nextStatus = status as OrderStatus;
    this.orders.update((orders) =>
      orders.map((order) => order.id === orderId ? { ...order, status: nextStatus } : order),
    );
    return of(this.orders().find((order) => order.id === orderId)).pipe(delay(200));
  }

  getAvailableDeliveries(): Observable<DeliveryRequest[]> {
    return of(this.deliveries().filter((delivery) => delivery.deliveryStatus === 'pending')).pipe(delay(250));
  }

  private normalizePaymentMethod(method: string): PaymentMethod {
    return ['cash', 'card', 'online', 'multicaixa'].includes(method)
      ? method as PaymentMethod
      : 'cash';
  }
}
