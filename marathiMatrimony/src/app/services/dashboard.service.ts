import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root' // makes it available globally
})
export class DashboardService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}
  getRecommendations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/dashboard/getrecommendations`);
  }

  deductContact(viewedUserId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/memberships/deductContact`, { viewedUserId });
  }

  getRecommendationsnew(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/dashboard/getRecommendationsNew`);
  }

  sendInterest(userId: string) {
  return this.http.post(`${this.apiUrl}/send-interest`, { userId });
}

unsendInterest(userId: string) {
  return this.http.post(`${this.apiUrl}/unsend-interest`, { userId });
}


}
