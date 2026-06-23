import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import { Equipment, Order } from './models';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private http = inject(HttpClient);

  equipment(sport?: string): Observable<Equipment[]> {
    let params = new HttpParams();
    if (sport) params = params.set('sport', sport);
    return this.http.get<Equipment[]>(`${API_BASE}/shop/equipment`, { params });
  }
  myOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_BASE}/shop/orders/mine`);
  }
  order(items: { equipment: string; qty: number }[]): Observable<Order> {
    return this.http.post<Order>(`${API_BASE}/shop/orders`, { items });
  }
  cancelOrder(id: string): Observable<any> {
    return this.http.patch(`${API_BASE}/shop/orders/${id}/cancel`, {});
  }
}
