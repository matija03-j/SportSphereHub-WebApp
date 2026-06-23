import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  me(): Observable<User> {
    return this.http.get<User>(`${API_BASE}/users/me`);
  }

  updateMe(data: FormData): Observable<User> {
    return this.http.patch<User>(`${API_BASE}/users/me`, data);
  }
}
