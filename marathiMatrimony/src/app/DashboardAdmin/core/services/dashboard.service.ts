import { Injectable } from '@angular/core';
import { DashboardStats } from '../models/dashboard.model';
import { PlanStat } from '../models/plan.model';
import { Observable, of } from 'rxjs'; // <-- Fix here

export interface UserGrowthResponse {
  labels: string[];
  total: number[];
  active: number[];
}

export interface PlanDistributionResponse {
  labels: string[];
  data: number[];
}


export interface PlanGrowthResponse {
  labels: string[];
  total: number[];
  active: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  getDashboardStats(): DashboardStats {
    return {
      totalUsers: 78,
      activeUsers: 58,
      inactiveUsers: 20,
      newUsers: 14
    };
  }

  getPlanStats(): PlanStat[] {
    return [
      { name: 'Welcome', count: 21, growth: 5 },
      { name: 'Bronze', count: 15, growth: 15 },
      { name: 'Silver', count: 18, growth: 12 },
      { name: 'Gold', count: 16, growth: 33 },
      { name: 'Platinum', count: 8, growth: 33 }
    ];
  }

  /** For charts */
  // 👉 Later replace this with HttpClient API call
  getUserGrowth(type: 'week' | 'month' | 'year'): Observable<UserGrowthResponse> {

    const data: any = {
      week: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        total: [10,20,35,45,55,65,70],
        active: [8,18,28,38,48,52,52]
      },
      month: {
        labels: ['W1','W2','W3','W4'],
        total: [40,60,80,100],
        active: [30,50,65,75]
      },
      year: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        total: [100,180,240,300,360,420],
        active: [80,140,200,260,300,340]
      }
    };

    return of(data[type]);
  }

  getPlanDistribution(): Observable<PlanDistributionResponse> {
    // Replace this with actual API call
    const data = {
      labels: ['Basic', 'Gold', 'Premium', 'Platinum'],
      data: [50, 30, 15, 5]
    };
    return of(data);
  }

getPlanGrowth(type: 'week' | 'month' | 'year'): Observable<PlanGrowthResponse> {
  // Example dummy data
  const dataMap = {
    week: { labels: ['Basic','Gold','Premium','Platinum'], total: [50,30,15,5], active: [40,20,10,3] },
    month: { labels: ['Basic','Gold','Premium','Platinum'], total: [200,120,60,20], active: [160,90,50,15] },
    year: { labels: ['Basic','Gold','Premium','Platinum'], total: [1200,800,400,100], active: [1000,600,300,70] }
  };
  return of(dataMap[type]);
}


}
