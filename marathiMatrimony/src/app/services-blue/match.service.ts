import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Match { name:string; age:number; city:string; photo:string; compat?:number; }

@Injectable({ providedIn: 'root' })
export class MatchService {
  private matches: Match[] = [
    { name:'Priya Patil', age:27, city:'Mumbai', photo:'assets/female1.jpg', compat:92 },
    { name:'Neha Sharma', age:28, city:'Nagpur', photo:'assets/female2.jpg', compat:88 },
    { name:'Sneha Deshmukh', age:29, city:'Pune', photo:'assets/female3.jpg', compat:84 },
    { name:'Aarij Joshi', age:28, city:'Nashik', photo:'assets/female4.jpg', compat:80 },
  ];

  getSuggestedMatches() { return of(this.matches).pipe(delay(400)); }
  getMatchOfTheDay() { return of(this.matches[0]).pipe(delay(200)); }
}
