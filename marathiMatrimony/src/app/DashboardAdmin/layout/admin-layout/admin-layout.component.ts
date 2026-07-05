import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminMenuService } from '../../core/services/admin-menu.service';
import { AdminMenuItem } from '../../core/models/admin-menu-item';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {

  sidenavOpen = false;          // sidebar hidden by default
  profileDropdownOpen = false;
  notificationsCount = 3;

  menu: AdminMenuItem[] = [];

  constructor(private menuService: AdminMenuService) {}

  ngOnInit(): void {
    this.menu = this.menuService.getMenu();
  }

  toggleSidenav() {
    this.sidenavOpen = !this.sidenavOpen;
  }

  closeSidenav() {
    this.sidenavOpen = false;
  }

  toggleProfileDropdown() {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  closeProfileDropdown() {
    this.profileDropdownOpen = false;
  }

  logout() {
    console.log('Logging out...');
  }
}
