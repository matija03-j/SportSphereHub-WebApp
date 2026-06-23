import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';

export interface AthleteStats {
  perSport: { sport: string; count: number }[];
  monthly: { label: string; count: number }[];
  totalEquipmentSpend: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private http = inject(HttpClient);

  athlete(): Observable<AthleteStats> {
    return this.http.get<AthleteStats>(`${API_BASE}/stats/athlete`);
  }
}
