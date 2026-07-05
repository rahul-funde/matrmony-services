import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { InterestResponse } from '../models/interest';

@Injectable({
  providedIn: 'root'
})
export class InterestService {

  private apiUrl = environment.apiUrl;

  // 🔥 BehaviorSubject to hold interests
  private interestsSubject = new BehaviorSubject<InterestResponse>({
    success: false,
    total: 0,
    sent: [],
    received: [],
    accepted: [],
    rejected: [],
    cancelled: []   // ✅ Added to match InterestResponse
  });

  // Public observable for components
  interests$ = this.interestsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * ✅ Load interests from backend
   */
  loadInterests(): void {
    this.http
      .get<InterestResponse>(`${this.apiUrl}/api/interest/getInterests`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching interests:', error);
          return of({
            success: false,
            total: 0,
            sent: [],
            received: [],
            accepted: [],
            rejected: [],
            cancelled: []   // ✅ Added to fallback
          } as InterestResponse);
        })
      )
      .subscribe(response => {
        this.interestsSubject.next(response); // 🔥 Update state
      });
  }

  /**
   * ✅ Send Interest
   */
  sendInterest(otherUserId: string): Observable<boolean> {
    return this.http
      .post(`${this.apiUrl}/api/interest/sendInterest`, { otherUserId })
      .pipe(
        tap(() => this.loadInterests()), // 🔥 Auto refresh state
        map(() => true),
        catchError((error) => {
          console.error('Error sending interest:', error);
          return of(false);
        })
      );
  }

  /**
   * ✅ Accept / Reject Interest
   */
  updateInterestStatus(
    interestId: string,
    status: 'accepted' | 'rejected'
  ): Observable<boolean> {
    return this.http
      .post(`${this.apiUrl}/api/interest/updateInterestStatus`, {
        interestId,
        newStatus: status
      })
      .pipe(
        tap(() => this.loadInterests()), // 🔥 Auto refresh
        map(() => true),
        catchError((error) => {
          console.error('Error updating interest:', error);
          return of(false);
        })
      );
  }

  /**
   * ✅ Withdraw Interest
   */
  withdrawInterest(interestId: string): Observable<boolean> {
    return this.http
      .post(`${this.apiUrl}/api/interest/updateInterestStatus`, {
        interestId,
        newStatus: 'cancelled'
      })
      .pipe(
        tap(() => this.loadInterests()),
        map(() => true),
        catchError((error) => {
          console.error('Error withdrawing interest:', error);
          return of(false);
        })
      );
  }
}
