import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header-blue/header.component';
import { SidebarComponent } from '../sidebar-blue/sidebar.component';
import { ProfileSummaryComponent } from '../profile-summary/profile-summary.component';
import { MatchSuggestionsComponent } from '../match-suggestions/match-suggestions.component';
import { MessagesPanelComponent } from '../messages-panel/messages-panel.component';
import { AnalyticsChartComponent } from '../analytics-chart/analytics-chart.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, ProfileSummaryComponent, MatchSuggestionsComponent, 
    MessagesPanelComponent, AnalyticsChartComponent, MatGridListModule, MatSidenavModule]
})
export class DashboardComponent {}
