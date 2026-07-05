import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DashboardFiltersComponent } from '../../shared/components/dashboard-filters/dashboard-filters.component';
import { UsersTableComponent } from './components/users-table/users-table.component';
import { UserGrowthChartComponent } from './components/user-growth-chart/user-growth-chart.component';
import { PlanDistributionChartComponent } from './components/plan-distribution-chart/plan-distribution-chart.component';
import { PlanGrowthChartComponent } from './components/plan-growth-chart/plan-growth-chart.component';

@Component({
  selector: 'app-admin-dashboard-new',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    DashboardFiltersComponent,
    UsersTableComponent,
    UserGrowthChartComponent,
    PlanDistributionChartComponent,
    PlanGrowthChartComponent
  ],
  templateUrl: './admin-dashboard-new.component.html',
  styleUrls: ['./admin-dashboard-new.component.css']
})
export class AdminDashboardNewComponent implements OnInit {

  stats = {
    totalUsers: 78,
    activeUsers: 58,
    inactiveUsers: 20,
    newUsers: 14
  };

  planStats = [
    { name: 'Welcome', count: 21, growth: 5 },
    { name: 'Bronze', count: 15, growth: 15 },
    { name: 'Silver', count: 18, growth: 12 },
    { name: 'Gold', count: 16, growth: 33 },
    { name: 'Platinum', count: 8, growth: 33 }
  ];

  constructor() {}

  ngOnInit(): void {}
}
