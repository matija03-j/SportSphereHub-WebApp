import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';

export interface Reviewable {
  facility: { _id: string; name: string; city: string };
  confirmed: number;
  used: number;
  remaining: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  reviewable(): Observable<Reviewable[]> {
    return this.http.get<Reviewable[]>(`${API_BASE}/reviews/reviewable`);
  }
  create(facility: string, reaction: 'like' | 'dislike', comment: string): Observable<any> {
    return this.http.post(`${API_BASE}/reviews`, { facility, reaction, comment });
  }
}
