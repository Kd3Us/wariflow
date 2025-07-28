import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface SessionRecord {
  id: string;
  date: Date;
  coachId: string;
  coachName: string;
  duration: number;
  topic: string;
  status: 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  objectives: string[];
  outcomes: string[];
  rating?: number;
  feedback?: string;
  nextSteps?: string[];
  tags: string[];
  documents?: SessionDocument[];
  progress: SessionProgress;
}

export interface SessionDocument {
  id: string;
  name: string;
  url: string;
  type: 'presentation' | 'notes' | 'recording' | 'document';
  uploadDate: Date;
}

export interface SessionProgress {
  goalsAchieved: number;
  totalGoals: number;
  skillsImproved: string[];
  nextFocusAreas: string[];
}

export interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  totalHours: number;
  mostFrequentTopics: string[];
  progressTrend: number;
}

export interface FeedbackForm {
  rating: number;
  feedback: string;
  objectives: string[];
  outcomes: string[];
  nextSteps: string[];
  wouldRecommend: boolean;
  improvementAreas: string[];
}

@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './session-history.component.html',
  styleUrls: ['./session-history.component.css']
})
export class SessionHistoryComponent implements OnInit {
  sessions: SessionRecord[] = [];
  filteredSessions: SessionRecord[] = [];
  dashboardStats: DashboardStats = {
    totalSessions: 0,
    completedSessions: 0,
    averageRating: 0,
    totalHours: 0,
    mostFrequentTopics: [],
    progressTrend: 0
  };

  feedbackForm: FormGroup;
  selectedSession: SessionRecord | null = null;
  
  viewMode: 'dashboard' | 'history' | 'feedback' | 'reports' = 'dashboard';
  showFeedbackModal: boolean = false;
  searchTerm: string = '';
  filterStatus: string = 'all';
  filterPeriod: string = 'all';
  sortBy: string = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  availableTopics: string[] = [
    'Stratégie Produit',
    'Leadership',
    'Marketing Digital',
    'Développement Personnel',
    'Gestion d\'Équipe',
    'Innovation',
    'Vente & Négociation',
    'Communication',
    'Gestion de Projet',
    'Entrepreneuriat'
  ];

  constructor(private fb: FormBuilder) {
    this.feedbackForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      feedback: ['', [Validators.required, Validators.minLength(10)]],
      objectives: [[]],
      outcomes: [[]],
      nextSteps: [[]],
      wouldRecommend: [true],
      improvementAreas: [[]]
    });
  }

  ngOnInit(): void {
    this.loadSessions();
    this.calculateDashboardStats();
  }

  loadSessions(): void {
    const mockSessions: SessionRecord[] = [
      {
        id: '1',
        date: new Date('2024-07-25T10:00:00'),
        coachId: 'coach-1',
        coachName: 'Sarah Martin',
        duration: 60,
        topic: 'Stratégie Produit',
        status: 'completed',
        notes: 'Session très productive sur la définition de la roadmap produit. Excellent focus sur les priorités.',
        objectives: ['Définir la roadmap Q4', 'Prioriser les fonctionnalités', 'Planifier les ressources'],
        outcomes: ['Roadmap validée', 'Priorités établies', 'Plan de ressources défini'],
        rating: 5,
        feedback: 'Excellente session, très constructive et orientée résultats.',
        nextSteps: ['Valider avec l\'équipe', 'Préparer le budget', 'Lancer le développement'],
        tags: ['produit', 'roadmap', 'stratégie'],
        documents: [
          {
            id: 'doc-1',
            name: 'Roadmap-Q4-2024.pdf',
            url: '/documents/roadmap-q4.pdf',
            type: 'presentation',
            uploadDate: new Date('2024-07-25T10:30:00')
          }
        ],
        progress: {
          goalsAchieved: 3,
          totalGoals: 3,
          skillsImproved: ['Priorisation', 'Planification stratégique'],
          nextFocusAreas: ['Exécution', 'Suivi des KPIs']
        }
      },
      {
        id: '2',
        date: new Date('2024-07-18T14:00:00'),
        coachId: 'coach-2',
        coachName: 'Marc Dubois',
        duration: 90,
        topic: 'Leadership',
        status: 'completed',
        notes: 'Travail approfondi sur les techniques de management et la communication d\'équipe.',
        objectives: ['Améliorer la communication', 'Développer le leadership', 'Gérer les conflits'],
        outcomes: ['Plan de communication créé', 'Techniques acquises', 'Stratégie définie'],
        rating: 4,
        feedback: 'Bon accompagnement, outils pratiques fournis.',
        nextSteps: ['Mettre en pratique', 'Organiser des 1-on-1', 'Suivre les progrès'],
        tags: ['leadership', 'management', 'communication'],
        documents: [],
        progress: {
          goalsAchieved: 2,
          totalGoals: 3,
          skillsImproved: ['Communication', 'Gestion d\'équipe'],
          nextFocusAreas: ['Résolution de conflits', 'Motivation d\'équipe']
        }
      },
      {
        id: '3',
        date: new Date('2024-07-10T09:00:00'),
        coachId: 'coach-1',
        coachName: 'Sarah Martin',
        duration: 45,
        topic: 'Marketing Digital',
        status: 'completed',
        notes: 'Session introductive sur les stratégies de marketing digital et l\'acquisition client.',
        objectives: ['Comprendre le marketing digital', 'Définir une stratégie', 'Choisir les canaux'],
        outcomes: ['Stratégie définie', 'Canaux sélectionnés', 'Budget alloué'],
        rating: 5,
        feedback: 'Très bonne introduction, exemples concrets appréciés.',
        nextSteps: ['Lancer les campagnes', 'Mesurer les résultats', 'Optimiser'],
        tags: ['marketing', 'digital', 'acquisition'],
        documents: [
          {
            id: 'doc-2',
            name: 'Strategie-Marketing-Digital.pptx',
            url: '/documents/marketing-strategy.pptx',
            type: 'presentation',
            uploadDate: new Date('2024-07-10T09:45:00')
          }
        ],
        progress: {
          goalsAchieved: 3,
          totalGoals: 3,
          skillsImproved: ['Marketing digital', 'Stratégie'],
          nextFocusAreas: ['Analytics', 'Optimisation']
        }
      }
    ];

    this.sessions = mockSessions;
    this.filteredSessions = [...this.sessions];
    this.applyFilters();
  }

  calculateDashboardStats(): void {
    const completedSessions = this.sessions.filter(s => s.status === 'completed');
    
    this.dashboardStats = {
      totalSessions: this.sessions.length,
      completedSessions: completedSessions.length,
      averageRating: completedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / completedSessions.length || 0,
      totalHours: completedSessions.reduce((sum, s) => sum + s.duration, 0) / 60,
      mostFrequentTopics: this.getMostFrequentTopics(),
      progressTrend: this.calculateProgressTrend()
    };
  }

  getMostFrequentTopics(): string[] {
    const topicCounts: { [key: string]: number } = {};
    this.sessions.forEach(session => {
      topicCounts[session.topic] = (topicCounts[session.topic] || 0) + 1;
    });
    
    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  calculateProgressTrend(): number {
    if (this.sessions.length < 2) return 0;
    
    const sortedSessions = this.sessions
      .filter(s => s.status === 'completed' && s.rating)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (sortedSessions.length < 2) return 0;
    
    const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
    const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + (s.rating || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + (s.rating || 0), 0) / secondHalf.length;
    
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }

  setViewMode(mode: 'dashboard' | 'history' | 'feedback' | 'reports'): void {
    this.viewMode = mode;
  }

  applyFilters(): void {
    this.filteredSessions = this.sessions.filter(session => {
      const matchesSearch = !this.searchTerm || 
        session.topic.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.coachName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (session.notes && session.notes.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesStatus = this.filterStatus === 'all' || session.status === this.filterStatus;

      const matchesPeriod = this.filterPeriod === 'all' || this.isInPeriod(session.date, this.filterPeriod);

      return matchesSearch && matchesStatus && matchesPeriod;
    });

    this.sortSessions();
  }

  isInPeriod(date: Date, period: string): boolean {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (period) {
      case 'week': return diffDays <= 7;
      case 'month': return diffDays <= 30;
      case 'quarter': return diffDays <= 90;
      default: return true;
    }
  }

  sortSessions(): void {
    this.filteredSessions.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortBy) {
        case 'date':
          aValue = a.date.getTime();
          bValue = b.date.getTime();
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'coach':
          aValue = a.coachName;
          bValue = b.coachName;
          break;
        default:
          return 0;
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  openFeedbackModal(session: SessionRecord): void {
    this.selectedSession = session;
    this.feedbackForm.patchValue({
      rating: session.rating || 5,
      feedback: session.feedback || '',
      objectives: session.objectives || [],
      outcomes: session.outcomes || [],
      nextSteps: session.nextSteps || [],
      wouldRecommend: true,
      improvementAreas: []
    });
    this.showFeedbackModal = true;
  }

  closeFeedbackModal(): void {
    this.showFeedbackModal = false;
    this.selectedSession = null;
  }

  submitFeedback(): void {
    if (this.feedbackForm.valid && this.selectedSession) {
      const feedbackData = this.feedbackForm.value;
      
      this.selectedSession.rating = feedbackData.rating;
      this.selectedSession.feedback = feedbackData.feedback;
      this.selectedSession.objectives = feedbackData.objectives;
      this.selectedSession.outcomes = feedbackData.outcomes;
      this.selectedSession.nextSteps = feedbackData.nextSteps;

      this.calculateDashboardStats();
      this.closeFeedbackModal();
    }
  }

  exportHistory(format: 'csv' | 'pdf'): void {
    if (format === 'csv') {
      this.exportToCSV();
    } else {
      this.exportToPDF();
    }
  }

  exportToCSV(): void {
    const csvHeaders = [
      'Date',
      'Coach',
      'Sujet',
      'Durée (min)',
      'Statut',
      'Note',
      'Objectifs atteints',
      'Total objectifs'
    ];

    const csvData = this.filteredSessions.map(session => [
      session.date.toLocaleDateString('fr-FR'),
      session.coachName,
      session.topic,
      session.duration.toString(),
      session.status,
      (session.rating || 0).toString(),
      session.progress.goalsAchieved.toString(),
      session.progress.totalGoals.toString()
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historique-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  exportToPDF(): void {
    window.print();
  }

  renderStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }

  getProgressPercentage(session: SessionRecord): number {
    return (session.progress.goalsAchieved / session.progress.totalGoals) * 100;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      case 'rescheduled': return 'Reportée';
      default: return status;
    }
  }

  trackByCoach(index: number, session: SessionRecord): string {
    return session.coachId;
  }

  getSessionCountByCoach(coachName: string): number {
    return this.sessions.filter(s => s.coachName === coachName).length;
  }

  getAverageRatingByCoach(coachName: string): number {
    const coachSessions = this.sessions.filter(s => s.coachName === coachName && s.rating);
    if (coachSessions.length === 0) return 0;
    return coachSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / coachSessions.length;
  }

  getAllSkillsImproved(): {name: string, count: number, percentage: number}[] {
    const skillCounts: { [key: string]: number } = {};
    
    this.sessions.forEach(session => {
      session.progress.skillsImproved.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    const maxCount = Math.max(...Object.values(skillCounts));
    
    return Object.entries(skillCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / maxCount) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }

  getTotalObjectives(): number {
    return this.sessions.reduce((sum, session) => sum + session.progress.totalGoals, 0);
  }

  getTotalAchievedObjectives(): number {
    return this.sessions.reduce((sum, session) => sum + session.progress.goalsAchieved, 0);
  }
}