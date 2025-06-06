// src/app/shared/components/chart/chart.component.ts

import { Component, Input, OnInit, ViewChild, ElementRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [style.height.px]="height">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
    }
  `]
})
export class ChartComponent implements OnInit, OnChanges {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() type: ChartType = 'line';
  @Input() data: any;
  @Input() options: any = {};
  @Input() height = 300;
  
  private chart?: Chart;
  
  ngOnInit(): void {
    this.createChart();
  }
  
  ngOnChanges(): void {
    if (this.chart) {
      this.updateChart();
    }
  }
  
  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const config: ChartConfiguration = {
      type: this.type,
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...this.options
      }
    };
    
    this.chart = new Chart(ctx, config);
  }
  
  private updateChart(): void {
    if (!this.chart) return;
    
    this.chart.data = this.data;
    this.chart.update('active');
  }
  
  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}