import { Component, EventEmitter, Output, HostListener, ViewChild, ElementRef, OnInit } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { AdminAuthService } from '../../services/admin-auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string; // or Date
  read: boolean;
}

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css']
})
export class TopNavComponent implements OnInit {
  @Output() toggleSidenav = new EventEmitter<void>();
  @ViewChild('toolbar', { static: true }) toolbar!: ElementRef<HTMLElement>;

  notifications: Notification[] = [];
  isScrolled: boolean = false;

  constructor(
    private authService: AdminAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Example notifications, replace with API call
    this.notifications = [
      { id: 1, title: 'Payment Approved', message: 'User John Doe payment has been approved.', time: '10 min ago', read: false },
      { id: 2, title: 'New User Registered', message: 'Jane Smith has signed up.', time: '30 min ago', read: false },
      { id: 3, title: 'Payment Rejected', message: 'Alice payment was rejected.', time: '1 hour ago', read: true },
    ];
  }

  get notificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  markNotificationRead(notification: Notification): void {
    notification.read = true;
  }
}
