import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'


@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Revenue by Plan + Payment Mode
  getRevenue(fromDate: string, toDate: string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/api/reports/revenue`, {
      params: { fromDate, toDate }
    });
  }

  // Revenue summary cards
  getRevenueSummary(fromDate: string, toDate: string): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/api/reports/revenue/summary`, {
      params: { fromDate, toDate }
    });
  }

  // Revenue by day (chart)
  getRevenueByDay(fromDate: string, toDate: string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/api/reports/revenue/by-day`, {
      params: { fromDate, toDate }
    });
  }

  // Revenue by period (day/week/month/plan/paymentMode)
  getRevenueByPeriod(fromDate: string, toDate: string, groupBy: string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/api/reports/revenue/period`, {
      params: { fromDate, toDate, groupBy }
    });
  }
}
