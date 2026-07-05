import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DashboardDataService } from '../service/dashboard-data.service';
import { Chart } from 'chart.js/auto';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-activity-insights',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './activity-insights.component.html',
  styleUrls: ['./activity-insights.component.css']
})
export class ActivityInsightsComponent implements OnInit, OnDestroy {
  chart: Chart | null = null;
  views: number[] = [];
  days: string[] = [];
  refreshInterval: any;
  isBrowser = false;

  constructor(
    private dataService: DashboardDataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // ✅ Detect if code is running in browser
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadChartData();

      // 🔁 Optional auto-refresh
      this.refreshInterval = setInterval(() => {
        this.updateChartData();
      }, 10000);
    }
  }

  private loadChartData(): void {
    this.dataService.getInsights().subscribe(res => {
      this.views = res.views;
      this.days = res.days;

      // ✅ Create chart only in browser context
      if (this.isBrowser) {
        this.createChart();
      }
    });
  }

  private createChart(): void {
    // ✅ Ensure document exists before accessing
    if (!this.isBrowser) return;

    const canvas = document.getElementById('activityChart') as HTMLCanvasElement | null;
    if (!canvas) return; // avoid errors if template not yet rendered

    // ✅ Destroy existing chart if any
    if (this.chart) {
      this.chart.destroy();
    }

    const textColor = '#1e293b';
    const gridColor = 'rgba(148,163,184,0.2)';

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.days,
        datasets: [
          {
            label: 'Profile Views',
            data: this.views,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#2563eb',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            padding: 10,
            cornerRadius: 6
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { weight: 500 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor }
          }
        }
      }
    });
  }

  private updateChartData(): void {
    if (!this.chart) return;

    const now = new Date();
    const newLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.days.push(newLabel);
    this.views.push(Math.floor(Math.random() * 100) + 50);

    if (this.days.length > 7) {
      this.days.shift();
      this.views.shift();
    }

    this.chart.data.labels = this.days;
    this.chart.data.datasets[0].data = this.views;
    this.chart.update();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
