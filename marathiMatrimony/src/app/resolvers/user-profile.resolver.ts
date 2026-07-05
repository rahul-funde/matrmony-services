import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AdminUserDataService } from '../services/admin-user-data.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserProfileResolver implements Resolve<any> {
  constructor(private userService: AdminUserDataService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const userId = route.paramMap.get('id')!;
    return this.userService.getUserById(userId);
  }

}
