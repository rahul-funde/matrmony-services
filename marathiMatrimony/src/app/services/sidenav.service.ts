import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
// import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})

export class SidenavService {
  // private apiUrl = environment.apiUrl;
  private toggleSubject = new Subject<void>();
  toggle$ = this.toggleSubject.asObservable();

  toggleSidenav() {
    console.log('SidenavService: toggleSidenav() called'); // ✅ Debugging Log
    this.toggleSubject.next(); // This will trigger the toggle in sidenav.component.ts
  }
  
  
}
