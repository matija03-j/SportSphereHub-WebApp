import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import { Facility, Trainer, User } from './models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${API_BASE}/admin`;

  users(role?: string): Observable<User[]> {
    const q = role ? `?role=${role}` : '';
    return this.http.get<User[]>(`${this.base}/users${q}`);
  }
  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}`, data);
  }
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.base}/users/${id}`);
  }

  requests(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/requests`);
  }
  decideRequest(id: string, decision: 'approved' | 'rejected'): Observable<User> {
    return this.http.patch<User>(`${this.base}/requests/${id}`, { decision });
  }

  pendingFacilities(): Observable<Facility[]> {
    return this.http.get<Facility[]>(`${this.base}/facilities/pending`);
  }
  decideFacility(id: string, decision: 'approved' | 'rejected'): Observable<any> {
    return this.http.patch(`${this.base}/facilities/${id}`, { decision });
  }

  trainers(): Observable<Trainer[]> {
    return this.http.get<Trainer[]>(`${this.base}/trainers`);
  }
  setTrainerActive(id: string, active: boolean): Observable<Trainer> {
    return this.http.patch<Trainer>(`${this.base}/trainers/${id}`, { active });
  }
}
