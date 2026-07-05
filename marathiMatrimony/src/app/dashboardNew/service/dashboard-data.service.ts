import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}
  // 🌐 Backend API call for user profile
  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/home/getUserProfile`);
  }
  getMatches(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}/dashboard/getRecommendationsNew`);
  }

  getMessages(): Observable<any[]> {
    return of([
      { name: 'Sneha', lastMessage: 'Hi Rahul!', photo: 'images/v3.webp' },
      { name: 'Riya', lastMessage: 'How are you?', photo: 'images/f5.webp' },
       { name: 'Sneha Patil', city: 'Pune', photo: 'images/f1.webp' },
      { name: 'Rohit Deshmukh', city: 'Mumbai', photo: 'images/f2.webp' },
      { name: 'Priya Shah', city: 'Nashik', photo: 'images/f3.webp' }
    ]);
  }

  getNotifications(): Observable<any[]> {
    return of([
      { text: 'New match found!', isNew: true },
      { text: 'Profile viewed by Riya', isNew: false },
      { text: 'You have a new message', isNew: true },
    ]);
  }

  getInsights(): Observable<any> {
    return of({
      views: [50, 80, 100, 120, 90, 150, 200],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    });
  }

  getReceivedRequests(): Observable<any[]> {
    return of([
      { name: 'Sneha Patil', city: 'Pune', photo: 'images/f1.webp' },
      { name: 'Rohit Deshmukh', city: 'Mumbai', photo: 'images/f2.webp' },
      { name: 'Priya Shah', city: 'Nashik', photo: 'images/f3.webp' }

    ]);
  }

  getSentRequests(): Observable<any[]> {
    return of([
      { name: 'Priya Shah', city: 'Nashik', photo: 'images/f3.webp' },
       { name: 'Sneha Patil', city: 'Pune', photo: 'images/f1.webp' },
      { name: 'Rohit Deshmukh', city: 'Mumbai', photo: 'images/f2.webp' },
      { name: 'Priya Shah', city: 'Nashik', photo: 'images/f3.webp' }
    ]);
  }

  getAcceptedConnections(): Observable<any[]> {
    return of([
      { name: 'Ankit Joshi', city: 'Nagpur', photo: 'images/f5.webp' },
       { name: 'Sneha Patil', city: 'Pune', photo: 'images/f1.webp' },
      { name: 'Rohit Deshmukh', city: 'Mumbai', photo: 'images/f2.webp' },
      { name: 'Priya Shah', city: 'Nashik', photo: 'images/f3.webp' }
    ]);
  }

}
