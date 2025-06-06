// src/app/core/services/analytics.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, interval, map, switchMap } from 'rxjs';
import { ApiService } from './api.service';

export interface AnalyticsData {
  responsesByDay: ChartData[];
  responsesByHour: ChartData[];
  completionRate: number;
  averageTime: number;
  deviceStats: DeviceData[];
  topQuestions: QuestionMetric[];
}

export interface ChartData {
  label: string;
  value: number;
  timestamp?: Date;
}

export interface DeviceData {
  device: 'mobile' | 'desktop' | 'tablet';
  count: number;
  percentage: number;
}

export interface QuestionMetric {
  questionId: string;
  title: string;
  dropoffRate: number;
  averageTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly api = inject(ApiService);
  
  // État réactif
  private readonly analyticsData = signal<AnalyticsData | null>(null);
  private readonly realTimeResponses = signal<number>(0);
  private readonly isLive = signal(false);
  
  // Computed values
  readonly data = computed(() => this.analyticsData());
  readonly liveCount = computed(() => this.realTimeResponses());
  readonly isLiveMode = computed(() => this.isLive());
  
  /**
   * Récupère les analytics d'un formulaire
   */
  getFormAnalytics(formId: string): Observable<AnalyticsData> {
    return this.api.get<AnalyticsData>(`/forms/${formId}/analytics`);
  }
  
  /**
   * Active le mode temps réel
   */
  startRealTimeTracking(formId: string): void {
    this.isLive.set(true);
    
    // Simuler des données temps réel - remplacer par WebSocket
    interval(5000).pipe(
      switchMap(() => this.api.get<{count: number}>(`/forms/${formId}/live-count`))
    ).subscribe(data => {
      this.realTimeResponses.set(data.count);
    });
  }
  
  /**
   * Génère des prédictions basées sur l'historique
   */
  getPredictions(formId: string): Observable<PredictionData> {
    return this.api.get<PredictionData>(`/forms/${formId}/predictions`);
  }
}

export interface PredictionData {
  expectedResponses: number;
  peakHours: string[];
  completionTrend: 'up' | 'down' | 'stable';
}