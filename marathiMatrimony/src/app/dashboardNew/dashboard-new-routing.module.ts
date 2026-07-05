import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardMainComponent } from './dashboard-main/dashboard-main.component';
import { ProfileSummaryComponent } from './profile-summary/profile-summary.component';
import { DailyMatchesComponent } from './daily-matches/daily-matches.component';
import { MessagesComponent } from './messages/messages.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { ActivityInsightsComponent } from './activity-insights/activity-insights.component';

// 👇 Define all dashboard routes here
const routes: Routes = [
  {
    path: '',
    redirectTo: 'main',
    pathMatch: 'full'
  },
  { path: 'main', component: DashboardMainComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule, CommonModule]
})
export class DashboardNewRoutingModule {}
