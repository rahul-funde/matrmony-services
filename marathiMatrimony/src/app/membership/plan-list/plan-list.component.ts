import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';

import { SidebarComponent } from '../../admin-dashboard/sidebar/sidebar.component';
import { TopNavComponent } from '../../admin-dashboard/top-nav/top-nav.component';
import { MaterialModule } from '../../material.module';
import { MembershipService } from '../membership.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  templateUrl: './plan-list.component.html',
  styleUrls: ['./plan-list.component.css'],
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule,
    MaterialModule,
    SidebarComponent,
    TopNavComponent,
    RouterModule,
    MatCheckboxModule,
    MatChipsModule
  ]
})
export class PlanListComponent implements OnInit {

  searchTerm = '';
  dataSource = new MatTableDataSource<any>([]);

// ================= COLUMN CONFIG =================
allColumns = [
  // { key: 'name', label: 'Plan Status' },
  { key: 'title', label: 'Name' },
  { key: 'duration', label: 'Duration' },
  { key: 'price', label: 'Price' },
  { key: 'priority', label: 'Priority' },
  { key: 'contactType', label: 'Contact Policy' },
  { key: 'dailyLimit', label: 'Daily' },
  { key: 'weeklyLimit', label: 'Weekly' },
  { key: 'monthlyLimit', label: 'Monthly' },
  { key: 'totalLimit', label: 'Total' },
  { key: 'carryForward', label: 'Carry Forward' },
  { key: 'features', label: 'Features' },
  { key: 'users', label: 'Users' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' }
];

displayedColumns: string[] = this.allColumns.map(c => c.key);

// ================= COLUMN TOGGLE =================
toggleColumn(column: string) {
  if (this.displayedColumns.includes(column)) {
    this.displayedColumns = this.displayedColumns.filter(c => c !== column);
  } else {
    this.displayedColumns = [...this.displayedColumns, column];
  }
}


  isSidenavOpen = false;

  constructor(
    private membershipService: MembershipService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans() {
    this.membershipService.getPlans().subscribe({
      next: (data) => {
        this.dataSource.data = data || [];
      },
      error: (err) => {
        console.error('Failed to fetch plans:', err);
        this.snackBar.open('Failed to load plans', 'Close', { duration: 3000 });
      }
    });
  }

  get filteredPlans() {
    const term = this.searchTerm.toLowerCase();
    return this.dataSource.data.filter(plan =>
      plan.name?.toLowerCase().includes(term)
    );
  }

  editPlan(plan: any) {
    this.router.navigate(['/plan-edit', plan.id]);
  }

  deletePlan(planId: string) {
    const confirmed = confirm('Are you sure you want to delete this plan?');
    if (!confirmed) return;

    this.membershipService.deletePlan(planId).subscribe({
      next: () => {
        this.snackBar.open('Plan deleted successfully!', 'Close', { duration: 3000 });
        this.loadPlans();
      },
      error: (err) => {
        console.error('Error deleting plan:', err);
        this.snackBar.open('Error deleting plan', 'Close', { duration: 3000 });
      }
    });
  }

  onSidenavToggle(opened: boolean) {
    this.isSidenavOpen = opened;
  }

}
