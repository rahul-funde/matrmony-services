import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

 canActivate(): Observable<boolean> {

  console.log("Guard triggered");
  console.log("Access token before check:", this.authService.getAccessToken());

  if (this.authService.isAuthenticated()) {
    console.log("Already authenticated ✅");
    return of(true);
  }

  console.log("Trying restoreSession...");

  return this.authService.restoreSession().pipe(
    map(() => {
      console.log("Session restored ✅");
      return true;
    }),
    catchError((err) => {
      console.log("Restore failed ❌", err);
      this.router.navigate(['/welcome']);
      return of(false);
    })
  );
}

}
