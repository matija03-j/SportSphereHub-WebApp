import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import { Trainer, Training } from './models';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private http = inject(HttpClient);

  trainers(facility?: string, sport?: string): Observable<Trainer[]> {
    let params = new HttpParams();
    if (facility) params = params.set('facility', facility);
    if (sport) params = params.set('sport', sport);
    return this.http.get<Trainer[]>(`${API_BASE}/trainings/trainers`, { params });
  }
  mine(): Observable<Training[]> {
    return this.http.get<Training[]>(`${API_BASE}/trainings/mine`);
  }
  book(data: { trainer: string; start: string; durationHours: number }): Observable<Training> {
    return this.http.post<Training>(`${API_BASE}/trainings`, data);
  }
}
