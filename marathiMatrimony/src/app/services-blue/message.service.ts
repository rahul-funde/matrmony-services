import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private received = [
    { name: 'Sneha Deshmukh', city: 'Pune', photo: 'assets/female3.jpg', time: '2h' },
    { name: 'Priya Patil', city: 'Mumbai', photo: 'assets/female1.jpg', time: '1d' },
  ];
  private sent = [{ name: 'Aarti Joshi', city: 'Nashik', photo: 'assets/female4.jpg', date: '25 Oct' }];

  getReceived() { return of(this.received).pipe(delay(350)); }
  getSent() { return of(this.sent).pipe(delay(350)); }
}
