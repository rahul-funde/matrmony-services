import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../admin-dashboard/sidebar/sidebar.component';
import { TopNavComponent } from '../../admin-dashboard/top-nav/top-nav.component';
import { MaterialModule } from '../../material.module';
import { PlanListComponent } from '../plan-list/plan-list.component'; // adjust path as needed
@Component({
  selector: 'app-membership-dashboard',
  standalone: true,
  templateUrl: './membership-dashboard.component.html',
  styleUrls: ['./membership-dashboard.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialModule,
    RouterModule,
    SidebarComponent,
    TopNavComponent,
    PlanListComponent
  ]
})
export class MembershipDashboardComponent {

 isSidenavOpen = false;

  onSidenavToggle(opened: boolean) {
    this.isSidenavOpen = opened;
  }
}
