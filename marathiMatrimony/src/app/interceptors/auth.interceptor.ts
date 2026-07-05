import {
  HttpInterceptorFn,
  HttpRequest,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';

const refreshTokenSubject = new BehaviorSubject<string | null>(null);
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next
): Observable<HttpEvent<unknown>> => {

  const authService = inject(AuthService);

  // Always send cookies (refresh token is httpOnly cookie)
  req = req.clone({
    withCredentials: true
  });

  const isAuthEndpoint =
    req.url.includes('/login') ||
    req.url.includes('/register') ||
    req.url.includes('/forgot-password') ||
    req.url.includes('/reset-password') ||
    req.url.includes('/token') ||
    req.url.includes('/logout');

  // Attach access token (memory only)
  if (!isAuthEndpoint) {
    const accessToken = authService.getAccessToken();
    if (accessToken) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      // Do NOT refresh if:
      // - Not 401
      // - Already calling /token
      // - Auth endpoints
      if (
        error.status !== 401 ||
        req.url.includes('/token') ||
        isAuthEndpoint
      ) {
        return throwError(() => error);
      }

      // ==============================
      // TOKEN REFRESH LOGIC
      // ==============================

      if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshAccessToken().pipe(
          switchMap((newToken: string) => {
            isRefreshing = false;
            refreshTokenSubject.next(newToken);

            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });

            return next(retryReq);
          }),
          catchError(err => {
            isRefreshing = false;
            authService.logout();
            return throwError(() => err);
          })
        );
      }

      // If refresh already in progress → wait
      return refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next(retryReq);
        })
      );
    })
  );
};
