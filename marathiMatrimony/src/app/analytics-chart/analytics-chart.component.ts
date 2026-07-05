import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { UserService } from '../services-blue/user.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-analytics-chart',
  templateUrl: './analytics-chart.component.html',
  styleUrls: ['./analytics-chart.component.scss'],
  standalone: true,
  imports: [CommonModule, NgChartsModule, MatCardModule],
  providers: [UserService]
})
export class AnalyticsChartComponent implements OnInit {
  public lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  public lineChartOptions: ChartOptions<'line'> = { responsive: true, plugins: { legend: { display: false } } };

  constructor(private us: UserService) {}

  ngOnInit(): void {
    this.us.getWeeklyViews().subscribe(vals => {
      this.lineChartData = {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [{ data: vals, label: 'Profile Views', fill: true }]
      };
    });
  }
}
