import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import { Facility, Promotion } from './models';

export interface HomeInfo {
  activeCount: number;
  top3: Array<{ _id: string; name: string; city: string; likeCount: number }>;
  promotions: Promotion[];
}

export interface FacilitySearchResult extends Facility {
  likeCount: number;
  dislikeCount: number;
  sportNames: string[];
}

export interface FacilityDetails extends Facility {
  likeCount: number;
  dislikeCount: number;
  recentReviews: any[];
}

export interface SearchFilters {
  name?: string;
  sport?: string;
  type?: 'open' | 'closed' | '';
  freeToday?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FacilityService {
  private http = inject(HttpClient);

  homeInfo(): Observable<HomeInfo> {
    return this.http.get<HomeInfo>(`${API_BASE}/facilities/home-info`);
  }

  cities(): Observable<string[]> {
    return this.http.get<string[]>(`${API_BASE}/facilities/cities`);
  }

  search(filters: SearchFilters): Observable<FacilitySearchResult[]> {
    let params = new HttpParams();
    if (filters.name) params = params.set('name', filters.name);
    if (filters.sport) params = params.set('sport', filters.sport);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.freeToday) params = params.set('freeToday', '1');
    return this.http.get<FacilitySearchResult[]>(`${API_BASE}/facilities/search`, { params });
  }

  details(id: string): Observable<FacilityDetails> {
    return this.http.get<FacilityDetails>(`${API_BASE}/facilities/${id}`);
  }
}
