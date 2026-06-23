import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';

export interface MyReservation {
  _id: string;
  facilityName: string;
  city: string;
  resourceName: string;
  sportName: string;
  resourceId: string;
  start: string;
  end: string;
  status: string;
}

export interface AvailabilitySlot {
  _id: string;
  start: string;
  end: string;
  status: string;
  user?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private http = inject(HttpClient);

  mine(): Observable<MyReservation[]> {
    return this.http.get<MyReservation[]>(`${API_BASE}/reservations/mine`);
  }

  availability(facility: string, resourceId: string, from: string, to: string): Observable<AvailabilitySlot[]> {
    const params = new HttpParams()
      .set('facility', facility)
      .set('resourceId', resourceId)
      .set('from', from)
      .set('to', to);
    return this.http.get<AvailabilitySlot[]>(`${API_BASE}/reservations/availability`, { params });
  }

  create(data: { facility: string; resourceId: string; sport?: string; start: string; durationHours: number }): Observable<any> {
    return this.http.post(`${API_BASE}/reservations`, data);
  }

  cancel(id: string): Observable<any> {
    return this.http.patch(`${API_BASE}/reservations/${id}/cancel`, {});
  }
}
