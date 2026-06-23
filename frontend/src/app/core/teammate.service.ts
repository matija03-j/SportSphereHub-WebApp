import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import { TeammateAd } from './models';

@Injectable({ providedIn: 'root' })
export class TeammateService {
  private http = inject(HttpClient);

  list(): Observable<TeammateAd[]> {
    return this.http.get<TeammateAd[]>(`${API_BASE}/teammates`);
  }
  mine(): Observable<TeammateAd[]> {
    return this.http.get<TeammateAd[]>(`${API_BASE}/teammates/mine`);
  }
  create(data: Partial<TeammateAd>): Observable<TeammateAd> {
    return this.http.post<TeammateAd>(`${API_BASE}/teammates`, data);
  }
  join(id: string): Observable<any> {
    return this.http.post(`${API_BASE}/teammates/${id}/join`, {});
  }
  decide(id: string, reqId: string, decision: 'approved' | 'rejected'): Observable<any> {
    return this.http.patch(`${API_BASE}/teammates/${id}/requests/${reqId}`, { decision });
  }
  close(id: string): Observable<any> {
    return this.http.patch(`${API_BASE}/teammates/${id}/close`, {});
  }
}
