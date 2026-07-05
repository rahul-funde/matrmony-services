import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Routing
import { DashboardNewRoutingModule } from './dashboard-new-routing.module';

// Components
import { DashboardMainComponent } from './dashboard-main/dashboard-main.component';
import { ProfileSummaryComponent } from './profile-summary/profile-summary.component';
import { DailyMatchesComponent } from './daily-matches/daily-matches.component';
import { MessagesComponent } from './messages/messages.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { ActivityInsightsComponent } from './activity-insights/activity-insights.component';
import { ConnectionRequestsComponent } from './connection-requests/connection-requests.component';

// Services & Pipes
import { DashboardDataService } from './service/dashboard-data.service';
import { CityFilterPipe } from './city-filter.pipe'; // ✅ Corrected path

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    DashboardNewRoutingModule,
     DashboardMainComponent,
    ProfileSummaryComponent,
    DailyMatchesComponent,
    MessagesComponent,
    NotificationsComponent,
    ActivityInsightsComponent,
    CityFilterPipe,
    ConnectionRequestsComponent
  ],
  providers: [DashboardDataService],
  exports: [DashboardMainComponent]
})
export class DashboardNewModule {}
