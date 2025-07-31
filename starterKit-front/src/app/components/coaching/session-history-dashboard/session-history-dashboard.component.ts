import { Component, OnInit } from '@angular/core';
import { SessionHistoryService, DashboardStats, SessionHistory } from '../../../services/session-history.service';

@Component({
  selector: 'app-session-history-dashboard',
  templateUrl: './session-history-dashboard.component.html',
  styleUrls: ['./session-history-dashboard.component.scss']
})
export class SessionHistoryDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentSessions: SessionHistory[] = [];
  isLoading = true;
  selectedPeriod = '6months';
  
  chartData: any = null;
  chartOptions: any = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Progression mensuelle'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  skillsChartData: any = null;
  skillsChartOptions: any = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Progression des compétences'
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100
      }
    }
  };

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
        this.prepareChartData();
        this.loadRecentSessions();
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        console.error('Impossible de charger les statistiques');
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

  prepareChartData(): void {
    if (!this.stats) return;

    this.chartData = {
      labels: this.stats.monthlyProgress.map(item => item.month),
      datasets: [
        {
          label: 'Sessions',
          data: this.stats.monthlyProgress.map(item => item.sessions),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Heures',
          data: this.stats.monthlyProgress.map(item => item.hours),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };

    this.skillsChartData = {
      labels: this.stats.skillsProgress.map(skill => skill.skill),
      datasets: [{
        label: 'Niveau',
        data: this.stats.skillsProgress.map(skill => skill.level),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)'
        ],
        borderWidth: 1
      }]
    };

    this.chartOptions.scales.y1 = {
      type: 'linear',
      display: true,
      position: 'right',
      grid: {
        drawOnChartArea: false,
      },
    };
  }

  exportData(format: 'json' | 'csv'): void {
    const userId = 'current-user';
    
    this.sessionHistoryService.exportHistory(userId, format).subscribe({
      next: (data) => {
        this.sessionHistoryService.downloadFile(data, data.filename, format);
        console.log(`Données exportées en ${format.toUpperCase()}`);
      },
      error: (error) => {
        console.error('Error exporting data:', error);
        console.error('Impossible d\'exporter les données');
      }
    });
  }

  generateReport(): void {
    const userId = 'current-user';
    
    this.sessionHistoryService.generateReport(userId).subscribe({
      next: (report) => {
        this.sessionHistoryService.downloadFile(
          { data: report }, 
          `rapport-coaching-${new Date().toISOString().split('T')[0]}.json`,
          'json'
        );
        console.log('Le rapport a été téléchargé');
      },
      error: (error) => {
        console.error('Error generating report:', error);
        console.error('Impossible de générer le rapport');
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
}