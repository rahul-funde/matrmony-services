import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../admin-dashboard/sidebar/sidebar.component';
import { TopNavComponent } from '../../admin-dashboard/top-nav/top-nav.component';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  templateUrl: './subscription-list.component.html',
  styleUrls: ['./subscription-list.component.css'],
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MaterialModule,
    SidebarComponent,
    TopNavComponent
  ]
})
export class SubscriptionListComponent {
  searchTerm = '';
  subscriptions = [
    { user: 'Ravi Patil', plan: 'Gold', start: '2025-06-01', end: '2025-09-01', status: 'Active' },
    { user: 'Sneha Kulkarni', plan: 'Platinum', start: '2025-01-15', end: '2025-07-15', status: 'Expired' },
    { user: 'Amit Deshmukh', plan: 'Silver', start: '2025-08-01', end: '2025-09-01', status: 'Active' }
  ];

  get filteredSubscriptions() {
    return this.subscriptions.filter(sub =>
      sub.user.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  renew(sub: any) {
    console.log('Renewing subscription for:', sub.user);
    // TODO: Trigger renewal logic
  }

  cancel(sub: any) {
    console.log('Cancelling subscription for:', sub.user);
    // TODO: Trigger cancellation logic
  }


  isSidenavOpen = false;

  onSidenavToggle(opened: boolean) {
    this.isSidenavOpen = opened;
  }
}
