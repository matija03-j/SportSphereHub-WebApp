import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import { Equipment, Facility, Order, Promotion } from './models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private base = `${API_BASE}/employee`;

  // Facilities
  facilities(): Observable<Facility[]> {
    return this.http.get<Facility[]>(`${this.base}/facilities`);
  }
  createFacility(data: any): Observable<Facility> {
    return this.http.post<Facility>(`${this.base}/facilities`, data);
  }
  createFacilityFromJson(file: File): Observable<Facility> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<Facility>(`${this.base}/facilities/json`, fd);
  }
  updateFacility(id: string, data: any): Observable<Facility> {
    return this.http.patch<Facility>(`${this.base}/facilities/${id}`, data);
  }
  addResource(id: string, data: any): Observable<Facility> {
    return this.http.post<Facility>(`${this.base}/facilities/${id}/resources`, data);
  }

  // Reservations & trainings
  reservations(): Observable<{ reservations: any[]; trainings: any[] }> {
    return this.http.get<{ reservations: any[]; trainings: any[] }>(`${this.base}/reservations`);
  }
  confirm(id: string): Observable<any> {
    return this.http.patch(`${this.base}/reservations/${id}/confirm`, {});
  }
  noShow(id: string): Observable<any> {
    return this.http.patch(`${this.base}/reservations/${id}/no-show`, {});
  }
  move(id: string, start: string): Observable<any> {
    return this.http.patch(`${this.base}/reservations/${id}/move`, { start });
  }

  // Promotions
  promotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.base}/promotions`);
  }
  createPromotion(data: any): Observable<Promotion> {
    return this.http.post<Promotion>(`${this.base}/promotions`, data);
  }
  updatePromotion(id: string, data: any): Observable<Promotion> {
    return this.http.patch<Promotion>(`${this.base}/promotions/${id}`, data);
  }
  deletePromotion(id: string): Observable<any> {
    return this.http.delete(`${this.base}/promotions/${id}`);
  }

  // Equipment & orders
  equipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${this.base}/equipment`);
  }
  createEquipment(data: FormData): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.base}/equipment`, data);
  }
  updateEquipment(id: string, data: FormData): Observable<Equipment> {
    return this.http.patch<Equipment>(`${this.base}/equipment/${id}`, data);
  }
  orders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders`);
  }
  updateOrderStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.base}/orders/${id}/status`, { status });
  }

  // Reports (PDF blobs)
  occupancyReport(month: string): Observable<Blob> {
    return this.http.get(`${this.base}/reports/occupancy?month=${month}`, { responseType: 'blob' });
  }
  equipmentReport(month: string): Observable<Blob> {
    return this.http.get(`${this.base}/reports/equipment?month=${month}`, { responseType: 'blob' });
  }
}
