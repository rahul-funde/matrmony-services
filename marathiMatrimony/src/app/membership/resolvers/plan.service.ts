import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { MembershipService } from '../membership.service';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PlanResolver implements Resolve<any> {
  constructor(private membershipService: MembershipService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const id = route.paramMap.get('id');
    return this.membershipService.getPlanById(id!).pipe(
      catchError(error => {
        console.error('Error fetching plan:', error);
        return of(null); // fallback if error occurs
      })
    );
  }
}
