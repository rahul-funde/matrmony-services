import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, filter, take, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;

  // 🔐 MEMORY ONLY STORAGE
  private accessToken: string | null = null;
  private userData: any = null;

  // Refresh handling
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ----------------------------------
  // UI Feedback
  // ----------------------------------
  showMessage(message: string): void {
    this.snackBar.open(message, this.translate.instant('common.close'), { duration: 3000 });
  }

  // ----------------------------------
  // REGISTER
  // ----------------------------------
  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/register`, data, {
      withCredentials: true
    });
  }

  // ----------------------------------
  // LOGIN
  // ----------------------------------
  login(data: any): Observable<any> {
    return this.http.post<{ accessToken: string; user: any }>(
      `${this.apiUrl}/api/auth/login`,
      data,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.accessToken = res.accessToken;
        this.userData = res.user;
      }),
      catchError(err => {
        this.showMessage(err.error?.message || this.translate.instant('auth.login.failed'));
        return throwError(() => err);
      })
    );
  }

  // ----------------------------------
  // LOGOUT
  // ----------------------------------
logout(): void {

  console.log('🚪 Logging out...');

  this.http.post(`${this.apiUrl}/api/auth/logout`, {}, {
    withCredentials: true
  }).subscribe({
    next: () => {
      console.log('✅ Backend logout successful');
    },
    error: (err) => {
      console.warn('⚠️ Backend logout failed, continuing anyway', err);
    }
  });

  // 🔐 Clear frontend auth state immediately
  this.accessToken = null;
  this.userData = null;

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('userData');

  console.log('🧹 Local auth data cleared');
}

  // ----------------------------------
  // ACCESS TOKEN (MEMORY ONLY)
  // ----------------------------------
  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // ----------------------------------
  // REFRESH ACCESS TOKEN (COOKIE BASED)
  // ----------------------------------
  refreshAccessToken(): Observable<string> {

    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1)
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.http.post<{ accessToken: string; user?: any }>(
      `${this.apiUrl}/api/auth/token`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.accessToken = res.accessToken;

        // Optional: update user if backend sends it
        if (res.user) {
          this.userData = res.user;
        }

        this.isRefreshing = false;
        this.refreshTokenSubject.next(res.accessToken);
      }),
      map(res => res.accessToken),
      catchError(err => {
        this.isRefreshing = false;
        this.accessToken = null;
        this.userData = null;
        return throwError(() => err);
      })
    );
  }

  // ----------------------------------
  // AUTO SESSION RESTORE (ON APP LOAD)
  // ----------------------------------
  restoreSession(): Observable<string> {
    return this.refreshAccessToken();
  }

  // ----------------------------------
  // USER DATA (MEMORY ONLY)
  // ----------------------------------
  getUserData(): any {
    return this.userData || {};
  }

  // ----------------------------------
  // PASSWORD RESET
  // ----------------------------------
  forgotPassword(contact: string | number): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/forgot-password`, { contact });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/reset-password`, { token, newPassword })
      .pipe(
        tap(() => this.showMessage(this.translate.instant('auth.passwordReset.success'))),
        catchError(err => {
          this.showMessage(this.translate.instant('auth.passwordReset.failed'));
          return throwError(() => err);
        })
      );
  }

  // ----------------------------------
  // OTP
  // ----------------------------------
  verifyOtp(userId: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/verify-otp`, { userId, otp });
  }

  resendOtp(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/resend-otp`, { userId });
  }

  // ----------------------------------
  // SSR SAFETY
  // ----------------------------------
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
