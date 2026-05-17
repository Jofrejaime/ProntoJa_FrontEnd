import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Category, Product, Restaurant } from '../models';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_RESTAURANTS } from './mock-data';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  getAll(search?: string, category = 'Todas'): Observable<Restaurant[]> {
    const query = (search ?? '').trim().toLowerCase();
    let restaurants = MOCK_RESTAURANTS.filter((restaurant) => restaurant.status === 'active');

    if (category && category !== 'Todas') {
      restaurants = restaurants.filter((restaurant) => restaurant.category === category);
    }

    if (query) {
      restaurants = restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(query)
        || restaurant.category.toLowerCase().includes(query)
        || restaurant.address.toLowerCase().includes(query),
      );
    }

    return of(restaurants).pipe(delay(250));
  }

  getById(id: number): Observable<Restaurant> {
    return of(MOCK_RESTAURANTS.find((restaurant) => restaurant.id === id) ?? MOCK_RESTAURANTS[0]).pipe(delay(200));
  }

  getMenu(restaurantId: number): Observable<{ categories: Category[]; products: Product[] }> {
    const categories = MOCK_CATEGORIES.filter((category) => category.restaurantId === restaurantId);
    const products = MOCK_PRODUCTS.filter((product) => product.restaurantId === restaurantId);
    return of({ categories, products }).pipe(delay(250));
  }
}
