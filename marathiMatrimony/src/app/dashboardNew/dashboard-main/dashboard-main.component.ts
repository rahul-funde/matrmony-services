import { Component } from '@angular/core';
// ✅ Import your standalone child components
import { ProfileSummaryComponent } from '../profile-summary/profile-summary.component';
import { DailyMatchesComponent } from '../daily-matches/daily-matches.component';
import { MessagesComponent } from '../messages/messages.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import { ActivityInsightsComponent } from '../activity-insights/activity-insights.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ConnectionRequestsComponent } from '../connection-requests/connection-requests.component';

@Component({
  selector: 'app-dashboard-main',
  standalone: true, // ✅ make standalone
  imports: [ 
    CommonModule,
    ProfileSummaryComponent,
    DailyMatchesComponent,
    MessagesComponent,
    NotificationsComponent,
    ActivityInsightsComponent,
    MatIconModule,
    ConnectionRequestsComponent
  ],
    templateUrl: './dashboard-main.component.html',
    styleUrls: ['./dashboard-main.component.css']
})
export class DashboardMainComponent {

}
