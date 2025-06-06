// src/app/features/dashboard/widgets/response-chart-widget.component.ts

import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-response-chart-widget',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  template: `
    <div class="widget-card" [class.expanded]="isExpanded()">
      <div class="widget-header">
        <h3 class="widget-title">
          <i class="material-icons">trending_up</i>
          {{ title }}
        </h3>
        <div class="widget-actions">
          <button class="btn-icon" (click)="toggleTimeRange()">
            <i class="material-icons">date_range</i>
          </button>
          <button class="btn-icon" (click)="toggleExpand()">
            <i class="material-icons">{{ isExpanded() ? 'compress' : 'expand' }}</i>
          </button>
        </div>
      </div>
      
      <!-- Time range selector -->
      <div class="time-range-selector" *ngIf="showTimeRange()">
        <button 
          *ngFor="let range of timeRanges"
          class="range-btn"
          [class.active]="selectedRange() === range.value"
          (click)="selectTimeRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
      
      <div class="widget-content">
        <app-chart
          [type]="chartType"
          [data]="chartData()"
          [options]="chartOptions"
          [height]="isExpanded() ? 400 : 250"
        />
        
        <!-- Stats summary -->
        <div class="stats-summary">
          <div class="stat-item">
            <span class="stat-value">{{ totalResponses() }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" [class.positive]="trend() > 0">
              {{ trend() > 0 ? '+' : '' }}{{ trend() }}%
            </span>
            <span class="stat-label">Évolution</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ peakTime() }}</span>
            <span class="stat-label">Pic d'activité</span>
          </div>
        </div>
      </div>
      
      <!-- Live indicator -->
      <div class="live-indicator" *ngIf="isLive()">
        <span class="live-dot"></span>
        <span>Temps réel</span>
      </div>
    </div>
  `,
  styles: [`
    .widget-card {
      background: var(--bg-primary);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-base);
      position: relative;
      overflow: hidden;
    }
    
    .widget-card.expanded {
      grid-column: span 2;
    }
    
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .widget-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      margin: 0;
    }
    
    .widget-title i {
      color: var(--primary-500);
    }
    
    .widget-actions {
      display: flex;
      gap: 0.25rem;
    }
    
    .btn-icon {
      width: 32px;
      height: 32px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-tertiary);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .btn-icon:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    
    .time-range-selector {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
    }
    
    .range-btn {
      padding: 0.25rem 0.75rem;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    
    .range-btn:hover {
      background: var(--bg-primary);
    }
    
    .range-btn.active {
      background: var(--primary-500);
      color: white;
    }
    
    .stats-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-value {
      display: block;
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
    }
    
    .stat-value.positive {
      color: var(--success-500);
    }
    
    .stat-label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }
    
    .live-indicator {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      background: var(--danger-50);
      color: var(--danger-600);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
    }
    
    .live-dot {
      width: 8px;
      height: 8px;
      background: var(--danger-500);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @media (max-width: 768px) {
      .widget-card.expanded {
        grid-column: span 1;
      }
    }
  `]
})
export class ResponseChartWidgetComponent implements OnInit {
  @Input() formId?: string;
  @Input() title = 'Réponses dans le temps';
  @Input() chartType: 'line' | 'bar' = 'line';
  
  // État du widget
  readonly isExpanded = signal(false);
  readonly showTimeRange = signal(false);
  readonly selectedRange = signal<'7d' | '30d' | '90d'>('7d');
  readonly isLive = signal(false);
  
  // Données
  readonly chartData = computed(() => this.generateChartData());
  readonly totalResponses = computed(() => this.calculateTotal());
  readonly trend = computed(() => this.calculateTrend());
  readonly peakTime = computed(() => '14h-16h');
  
  readonly timeRanges = [
    { value: '7d' as const, label: '7 jours' },
    { value: '30d' as const, label: '30 jours' },
    { value: '90d' as const, label: '3 mois' }
  ];
  
  readonly chartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    }
  };
  
  ngOnInit(): void {
    // Charger les données si formId fourni
    if (this.formId) {
      this.loadData();
    }
  }
  
  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }
  
  toggleTimeRange(): void {
    this.showTimeRange.update(v => !v);
  }
  
  selectTimeRange(range: '7d' | '30d' | '90d'): void {
    this.selectedRange.set(range);
    this.loadData();
  }
  
  private loadData(): void {
    // Implémenter le chargement des données
  }
  
  private generateChartData(): any {
    // Générer des données de démonstration
    const days = this.selectedRange() === '7d' ? 7 : this.selectedRange() === '30d' ? 30 : 90;
    const labels = [];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
      data.push(Math.floor(Math.random() * 100) + 20);
    }
    
    return {
      labels,
      datasets: [{
        label: 'Réponses',
        data,
        borderColor: 'rgb(33, 150, 243)',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4
      }]
    };
  }
  
  private calculateTotal(): number {
    const data = this.chartData();
    return data.datasets[0]?.data.reduce((a: number, b: number) => a + b, 0) || 0;
  }
  
  private calculateTrend(): number {
    const data = this.chartData().datasets[0]?.data || [];
    if (data.length < 2) return 0;
    
    const recent = data.slice(-7).reduce((a: number, b: number) => a + b, 0);
    const previous = data.slice(-14, -7).reduce((a: number, b: number) => a + b, 0);
    
    return previous === 0 ? 100 : Math.round(((recent - previous) / previous) * 100);
  }
}