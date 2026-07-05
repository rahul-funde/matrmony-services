import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DashboardService, UserGrowthResponse } from '../../../../core/services/dashboard.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-growth-chart',
  templateUrl: './user-growth-chart.component.html',
  styleUrls: ['./user-growth-chart.component.css']
})
export class UserGrowthChartComponent implements AfterViewInit {

  @ViewChild('userGrowthCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  chart!: Chart;
  view: 'week' | 'month' | 'year' = 'week';

  dataMap: Record<'week' | 'month' | 'year', UserGrowthResponse> = {
    week: { labels: [], total: [], active: [] },
    month: { labels: [], total: [], active: [] },
    year: { labels: [], total: [], active: [] }
  };

  loading = true; // optional flag to handle loading state

  constructor(private dashboardService: DashboardService) {}

  ngAfterViewInit(): void {
    this.loadData();
  }
setView(type: 'week' | 'month' | 'year'): void {
  this.view = type;

  const d = this.dataMap[this.view];
  if (d.labels.length) {
    this.updateChart();
  }
}

  // setView(type: 'week' | 'month' | 'year'): void {
  //   this.view = type;
  //   this.updateChart();
  // }

  private loadData(): void {
    // Fetch all 3 datasets in parallel
    forkJoin({
      week: this.dashboardService.getUserGrowth('week'),
      month: this.dashboardService.getUserGrowth('month'),
      year: this.dashboardService.getUserGrowth('year')
    }).subscribe(res => {
      this.dataMap.week = res.week;
      this.dataMap.month = res.month;
      this.dataMap.year = res.year;

      this.initChart();
      this.loading = false;
    });
  }

  private initChart(): void {
    const d = this.dataMap[this.view];

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: d.labels,
        datasets: [
          {
            label: 'Total Users',
            data: d.total,
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13,110,253,0.2)',
          },
          {
            label: 'Active Users',
            data: d.active,
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            borderColor: '#198754',
            backgroundColor: 'rgba(25,135,84,0.2)',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  private updateChart(): void {
    if (!this.chart) return;

    const d = this.dataMap[this.view];

    // Update chart data
    this.chart.data.labels = d.labels;
    this.chart.data.datasets[0].data = d.total;
    this.chart.data.datasets[1].data = d.active;

    this.chart.update();
  }
}
