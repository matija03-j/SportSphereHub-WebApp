import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import { Sport } from './models';

@Injectable({ providedIn: 'root' })
export class SportService {
  private http = inject(HttpClient);

  list(): Observable<Sport[]> {
    return this.http.get<Sport[]>(`${API_BASE}/sports`);
  }

  create(name: string): Observable<Sport> {
    return this.http.post<Sport>(`${API_BASE}/sports`, { name });
  }
}
