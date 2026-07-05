import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DashboardService } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-plan-distribution-chart',
  templateUrl: './plan-distribution-chart.component.html',
  styleUrls: ['./plan-distribution-chart.component.css']
})
export class PlanDistributionChartComponent implements AfterViewInit {

  @ViewChild('planDistributionCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  chart!: Chart;

  constructor(private dashboardService: DashboardService) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.loadData(), 0); // wait for DOM
  }

  private loadData(): void {
    this.dashboardService.getPlanDistribution().subscribe(res => {
      if (res.labels.length && res.data.length) {
        this.initChart(res.labels, res.data);
      }
    });
  }

  private initChart(labels: string[], data: number[]): void {
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: 'Plan Distribution',
          data: data,
          backgroundColor: ['#0d6efd','#198754','#ffc107','#dc3545'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}
