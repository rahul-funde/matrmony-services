import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { forkJoin } from 'rxjs';

interface PlanGrowthResponse {
  labels: string[];
  total: number[];
  active: number[];
}

@Component({
  selector: 'app-plan-growth-chart',
  templateUrl: './plan-growth-chart.component.html',
  styleUrls: ['./plan-growth-chart.component.css']
})
export class PlanGrowthChartComponent implements AfterViewInit {

  @ViewChild('planGrowthCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  chart!: Chart;
  view: 'week' | 'month' | 'year' = 'week';
  loading = true;

  // store all three views
  dataMap: Record<'week' | 'month' | 'year', PlanGrowthResponse> = {
    week: { labels: [], total: [], active: [] },
    month: { labels: [], total: [], active: [] },
    year: { labels: [], total: [], active: [] }
  };

  constructor(private dashboardService: DashboardService) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.loadData(), 0); // ensure DOM is ready
  }

  setView(type: 'week' | 'month' | 'year'): void {
    this.view = type;
    this.updateChart();
  }

  private loadData(): void {
    // fetch all three views in parallel
    forkJoin({
      week: this.dashboardService.getPlanGrowth('week'),
      month: this.dashboardService.getPlanGrowth('month'),
      year: this.dashboardService.getPlanGrowth('year')
    }).subscribe(res => {
      this.dataMap = res;
      this.loading = false;
      this.initChart();
    });
  }
private initChart(): void {
  const d = this.dataMap[this.view];

  // Destroy old chart if it exists
  if (this.chart) this.chart.destroy();

  this.chart = new Chart(this.canvasRef.nativeElement, {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'Total Users',
          data: d.total,
          backgroundColor: '#0d6efd',
          borderRadius: 6,
          barPercentage: 0.6
        },
        {
          label: 'Active Users',
          data: d.active,
          backgroundColor: '#198754',
          borderRadius: 6,
          barPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (context) => {
              // Get index of the bar
              const index = context.dataIndex;

              // Access dataset values safely
              const total = Number(d.total[index] ?? 0);
              const active = Number(d.active[index] ?? 0);

              // Value of the hovered bar
              const value = Number(context.raw ?? 0);

              // Percent growth calculation
              const percent = total > 0 ? ((active / total) * 100).toFixed(1) : '0';

              return `${context.dataset.label}: ${value} (${percent}%)`;
            }
          }
        }
      },
      scales: {
        x: { stacked: false },
        y: { beginAtZero: true }
      }
    }
  });
}


  private updateChart(): void {
    if (!this.chart) return;
    const d = this.dataMap[this.view];

    this.chart.data.labels = d.labels;
    this.chart.data.datasets[0].data = d.total;
    this.chart.data.datasets[1].data = d.active;
    this.chart.update();
  }
}
