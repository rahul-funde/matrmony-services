import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'

export interface SearchFilters {
  seeking?: string;
  fromage?: number;
  toage?: number;
  castes?: string;
  maritialstatus?: string;
  occupationtype?: string;
  profileId?: string;
}

export interface PopupBanner {
  id: string;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  ctaAction: string;
  priority: number;
  active: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class LandingpageService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private images: string[] = [
    'assets/images/bg1.jpg',
    'assets/images/bg2.jpg',
    'assets/images/bg3.jpg'
  ];
  
  searchProfiles(filters: SearchFilters): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/landingPage/searchProfiles`, filters);
  }

  private index = 0;

  getNextImage(): string {
    this.index = (this.index + 1) % this.images.length;
    return this.images[this.index];
  }

  getCurrentImage(): string {
    return this.images[this.index];
  }
    getImages(): string[] {
    return this.images;
  }

  getPopupBanners(): Observable<PopupBanner[]> {
    return this.http.get<PopupBanner[]>(`${this.apiUrl}/api/banners`);
  }

}
