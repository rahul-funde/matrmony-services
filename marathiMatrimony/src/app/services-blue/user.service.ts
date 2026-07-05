import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private user = {
    id: 1,
    name: 'Rahul Funde',
    age: 29,
    city: 'Pune, Maharashtra',
    profession: 'Software Engineer',
    photo: 'assets/user.jpg',
    completeness: 82
  };

  getUser() {
    return of(this.user).pipe(delay(300));
  }

  getProfileStats() {
    return of({ views: 152, interests: 12, shortlisted: 6, matches: 25 }).pipe(delay(300));
  }

  getWeeklyViews() {
    return of([12,18,25,20,22,30,25]).pipe(delay(300));
  }
}
