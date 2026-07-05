import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
import { SidenavMenuService } from '../services/sidenav-menu.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  apiUrl = environment.apiUrl;
  userData: any = null;
  profileImageUrl: string = '';

  isMobile = window.innerWidth <= 768;

  // Notifications
  notifications = [
    { id: 1, title: 'New message from John', time: '2 min ago', read: false },
    { id: 2, title: 'Your plan has been upgraded', time: '1 hr ago', read: false },
    { id: 3, title: 'Server maintenance scheduled', time: '1 day ago', read: false }
  ];

  get notificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  isUserOnline = true;
  isPremiumUser = false;

  // Header scroll state
  isHeaderHidden = false;
  lastScrollTop = 0;

  constructor(
    private sidenavMenuService: SidenavMenuService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Load user from session
    const storedUser = sessionStorage.getItem('userData');
    if (storedUser) {
      this.userData = JSON.parse(storedUser);
      this.profileImageUrl = this.userData.profileimg
        ? `${this.apiUrl}/uploads/profile/thumbs/${this.userData.profileimg}`
        : 'images/avatar.png';

      this.isPremiumUser = this.userData?.activePlan === 'premium';

      // Set user state for sidebar service
      this.sidenavMenuService.setUser(
        this.userData.role || 'user',
        this.isPremiumUser
      );
    }
  }

  // Sidebar toggle
  toggleSidenav() {
    this.sidenavMenuService.toggleOpen();
  }

  // 🔐 Logout Method (Component)
  logout(): void {

    console.log('🔒 Logout triggered');

    // Close any open dialogs
    this.dialog.closeAll();

    // Clear authentication data
    this.authService.logout();

    // Navigate safely and prevent back navigation
    this.router.navigate(['/welcome'], { replaceUrl: true });
  }

  // Fallback profile image
  onImageError(event: any) {
    event.target.src = 'images/avatar.png';
  }

  // Mark notification as read
  markAsRead(notification: any) {
    notification.read = true;
  }

  // Header hide on scroll
  @HostListener('window:scroll', [])
  onScroll() {
    const st = window.pageYOffset || document.documentElement.scrollTop;
    this.isHeaderHidden = st > this.lastScrollTop && st > 80;
    this.lastScrollTop = st <= 0 ? 0 : st;
  }

  // Detect mobile resize
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }
}
