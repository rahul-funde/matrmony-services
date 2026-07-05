import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { MembershipService } from '../membership/membership.service';
import { map, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanGuard implements CanActivate {

  constructor(
    private membershipService: MembershipService,
    private router: Router
  ) {}

  canActivate() {

    console.log('🛡️ PlanGuard triggered');

    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const userId = userData?.userId;

    console.log('User ID in PlanGuard:', userId);

    if (!userId) {
      console.log('❌ No userId → redirecting to welcome');
      return this.router.createUrlTree(['/welcome']);
    }

    return this.membershipService.getCurrentPlan(userId).pipe(
      map((res: any) => {

        console.log('Plan API response:', res);

        if (res?.hasPlan && res?.isActive) {
          console.log('✅ Plan active → allow dashboard');
          return true;
        }

        console.log('❌ No active plan → redirect to upgrade');
        return this.router.createUrlTree(['/upgrade-userplans']);
      }),
      catchError((err) => {
        console.error('Plan check error:', err);
        return of(this.router.createUrlTree(['/upgrade-userplans']));
      })
    );
  }
}
