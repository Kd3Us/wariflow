import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SessionHistoryService, DashboardStats, SessionHistory } from '../../../services/session-history.service';

@Component({
  selector: 'app-session-history-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './session-history-dashboard.component.html',
  styleUrls: ['./session-history-dashboard.component.css']
})
export class SessionHistoryDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentSessions: SessionHistory[] = [];
  isLoading = true;
  selectedPeriod = '6months';

  constructor(
    private sessionHistoryService: SessionHistoryService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    const userId = 'current-user';

    this.sessionHistoryService.getDashboardStats(userId).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loadRecentSessions();
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadRecentSessions(): void {
    const userId = 'current-user';
    
    this.sessionHistoryService.getUserSessionHistory(userId).subscribe({
      next: (sessions) => {
        this.recentSessions = sessions.slice(0, 5);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading recent sessions:', error);
        this.isLoading = false;
      }
    });
  }

  exportData(format: 'json' | 'csv'): void {
    const userId = 'current-user';
    
    this.sessionHistoryService.exportHistory(userId, format).subscribe({
      next: (data) => {
        console.log(`Données exportées en ${format.toUpperCase()}`);
      },
      error: (error) => {
        console.error('Error exporting data:', error);
      }
    });
  }

  generateReport(): void {
    const userId = 'current-user';
    
    this.sessionHistoryService.generateReport(userId).subscribe({
      next: (report) => {
        console.log('Rapport généré');
      },
      error: (error) => {
        console.error('Error generating report:', error);
      }
    });
  }

  getProgressBarWidth(current: number, total: number): number {
    return total > 0 ? (current / total) * 100 : 0;
  }

  getProgressBarColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getRatingStars(rating: number): Array<{ filled: boolean }> {
    return Array.from({ length: 5 }, (_, i) => ({ filled: i < rating }));
  }

  getSkillLevelColor(level: number): string {
    if (level >= 80) return 'text-green-600';
    if (level >= 60) return 'text-blue-600';
    if (level >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }

  getSkillLevelText(level: number): string {
    if (level >= 80) return 'Expert';
    if (level >= 60) return 'Avancé';
    if (level >= 40) return 'Intermédiaire';
    return 'Débutant';
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
    }
    return `${remainingMinutes}min`;
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  onPeriodChange(): void {
    this.loadDashboardData();
  }

  getStatIcon(type: string): string {
    switch (type) {
      case 'sessions': return '📊';
      case 'rating': return '⭐';
      case 'progress': return '📈';
      case 'time': return '⏱️';
      default: return '📊';
    }
  }

  getStatColor(type: string): string {
    switch (type) {
      case 'sessions': return 'sessions';
      case 'rating': return 'rating';
      case 'progress': return 'progress';
      case 'time': return 'time';
      default: return 'sessions';
    }
  }

  getChangeIcon(change: number): string {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '➡️';
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  }

  formatPercentage(value: number): string {
    return `${Math.abs(value).toFixed(1)}%`;
  }

  formatHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
    }
    return `${remainingMinutes}min`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      case 'no-show': return 'no-show';
      default: return 'scheduled';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      case 'no-show': return 'Absent';
      case 'scheduled': return 'Programmée';
      default: return status;
    }
  }
}