import { Injectable } from '@angular/core';
import { AdminMenuItem } from '../models/admin-menu-item';

@Injectable({
  providedIn: 'root'
})
export class AdminMenuService {
  constructor() { }
  getMenu(): AdminMenuItem[] {
    return [
      { label: 'Dashboard', icon: '🏠', route: '/admin/dashboard' },
      { label: 'Plans', icon: '💎', route: '/admin/plans' },
      { label: 'Subscriptions', icon: '📦', route: '/admin/subscriptions' },
      { label: 'Coupons', icon: '🏷', route: '/admin/coupons' },
      { label: 'Reports', icon: '📊', route: '/admin/reports' }
    ];
//    return this.http.get<AdminMenuItem[]>('/api/admin/menu');

  }
}
