import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SessionHistoryService, SessionHistory, DetailedFeedback } from '../../../services/session-history.service';
import { FeedbackModalComponent } from '../feedback-modal/feedback-modal.component';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    RouterModule,
    FeedbackModalComponent
  ],
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.css']
})
export class SessionListComponent implements OnInit {
  sessions: SessionHistory[] = [];
  filteredSessions: SessionHistory[] = [];
  selectedSession: SessionHistory | null = null;
  
  isLoading = true;
  error: string | null = null;
  
  showFeedbackModal = false;
  showSessionDetail = false;

  // Exposer Math pour le template
  Math = Math;

  filters = {
    search: '',
    coachId: '',
    startDate: '',
    endDate: '',
    topic: '',
    minRating: null as number | null,
    status: '',
    tags: [] as string[]
  };

  availableTopics: string[] = [];
  availableCoaches: Array<{ id: string; name: string }> = [];
  availableTags: string[] = [];
  availableStatuses = [
    { value: '', label: 'Tous les statuts' },
    { value: 'completed', label: 'Terminées' },
    { value: 'cancelled', label: 'Annulées' },
    { value: 'no-show', label: 'Absent' }
  ];
  
  sortBy = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  pagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  };
  
  viewMode: 'grid' | 'list' = 'list';

  constructor(private sessionHistoryService: SessionHistoryService) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading = true;
    const userId = 'current-user';
    
    this.sessionHistoryService.getUserSessionHistory(userId, this.buildFilters()).subscribe({
      next: (sessions) => {
        this.sessions = sessions.map(s => ({
          ...s,
          date: new Date(s.date)
        }));
        this.extractFilterOptions();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.error = 'Erreur lors du chargement des séances';
        this.isLoading = false;
      }
    });
  }

  buildFilters(): any {
    const activeFilters: any = {};
    
    if (this.filters.coachId) activeFilters.coachId = this.filters.coachId;
    if (this.filters.startDate) activeFilters.startDate = this.filters.startDate;
    if (this.filters.endDate) activeFilters.endDate = this.filters.endDate;
    if (this.filters.topic) activeFilters.topics = [this.filters.topic];
    if (this.filters.minRating) activeFilters.minRating = this.filters.minRating;
    if (this.filters.status) activeFilters.status = this.filters.status;
    if (this.filters.tags.length > 0) activeFilters.tags = this.filters.tags;
    
    return activeFilters;
  }

  extractFilterOptions(): void {
    this.availableTopics = [...new Set(this.sessions.map(s => s.topic))].sort();
    this.availableCoaches = [...new Set(this.sessions.map(s => ({ id: s.coachId, name: s.coachName })))];
    this.availableTags = [...new Set(this.sessions.flatMap(s => s.tags || []))].sort();
  }

  applyFilters(): void {
    let filtered = [...this.sessions];

    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(session => 
        session.topic.toLowerCase().includes(searchLower) ||
        session.coachName.toLowerCase().includes(searchLower) ||
        (session.notes && session.notes.toLowerCase().includes(searchLower)) ||
        (session.feedback && session.feedback.toLowerCase().includes(searchLower)) ||
        session.objectives.some(obj => obj.toLowerCase().includes(searchLower)) ||
        session.outcomes.some(out => out.toLowerCase().includes(searchLower))
      );
    }

    if (this.filters.coachId) {
      filtered = filtered.filter(s => s.coachId === this.filters.coachId);
    }

    if (this.filters.topic) {
      filtered = filtered.filter(s => s.topic === this.filters.topic);
    }

    if (this.filters.status) {
      filtered = filtered.filter(s => s.status === this.filters.status);
    }

    if (this.filters.minRating) {
      filtered = filtered.filter(s => s.rating && s.rating >= this.filters.minRating!);
    }

    if (this.filters.startDate) {
      const startDate = new Date(this.filters.startDate);
      filtered = filtered.filter(s => s.date >= startDate);
    }

    if (this.filters.endDate) {
      const endDate = new Date(this.filters.endDate);
      filtered = filtered.filter(s => s.date <= endDate);
    }

    if (this.filters.tags.length > 0) {
      filtered = filtered.filter(s => 
        this.filters.tags.some(tag => s.tags?.includes(tag))
      );
    }

    this.applySorting(filtered);
    this.updatePagination(filtered);
  }

  applySorting(sessions: SessionHistory[]): void {
    sessions.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'coach':
          comparison = a.coachName.localeCompare(b.coachName);
          break;
        case 'topic':
          comparison = a.topic.localeCompare(b.topic);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        default:
          comparison = 0;
      }
      
      return this.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  updatePagination(sessions: SessionHistory[]): void {
    this.pagination.totalItems = sessions.length;
    this.pagination.totalPages = Math.ceil(sessions.length / this.pagination.itemsPerPage);
    
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const endIndex = startIndex + this.pagination.itemsPerPage;
    
    this.filteredSessions = sessions.slice(startIndex, endIndex);
  }

  onFiltersChange(): void {
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.pagination.currentPage = page;
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      coachId: '',
      startDate: '',
      endDate: '',
      topic: '',
      minRating: null,
      status: '',
      tags: []
    };
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  toggleTag(tag: string): void {
    const index = this.filters.tags.indexOf(tag);
    if (index > -1) {
      this.filters.tags.splice(index, 1);
    } else {
      this.filters.tags.push(tag);
    }
    this.onFiltersChange();
  }

  isTagSelected(tag: string): boolean {
    return this.filters.tags.includes(tag);
  }

  openSessionDetail(session: SessionHistory): void {
    this.selectedSession = session;
    this.showSessionDetail = true;
  }

  closeSessionDetail(): void {
    this.showSessionDetail = false;
    this.selectedSession = null;
  }

  openFeedbackModal(session: SessionHistory): void {
    this.selectedSession = session;
    this.showFeedbackModal = true;
  }

  closeFeedbackModal(): void {
    this.showFeedbackModal = false;
    this.selectedSession = null;
  }

  onFeedbackSubmitted(feedback: DetailedFeedback): void {
    this.loadSessions();
    this.closeFeedbackModal();
  }

  getRatingStars(rating: number): Array<{ filled: boolean }> {
    return Array.from({ length: 5 }, (_, i) => ({ filled: i < rating }));
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'no-show': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      case 'no-show': return 'Absent';
      default: return status;
    }
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
    }
    return `${remainingMinutes}min`;
  }

  getProgressPercentage(session: SessionHistory): number {
    if (!session.progress) return 0;
    return session.progress.totalGoals > 0 
      ? (session.progress.goalsAchieved / session.progress.totalGoals) * 100 
      : 0;
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return 'sort';
    return this.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc';
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const total = this.pagination.totalPages;
    const current = this.pagination.currentPage;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current > 4) {
        pages.push(-1);
      }
      
      const start = Math.max(2, current - 2);
      const end = Math.min(total - 1, current + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < total - 3) {
        pages.push(-1);
      }
      
      pages.push(total);
    }
    
    return pages;
  }

  exportSessions(): void {
    const userId = 'current-user';
    
    this.sessionHistoryService.exportHistory(userId, 'csv').subscribe({
      next: (data) => {
        // Gérer le téléchargement
        console.log('Export réussi');
      },
      error: (error) => {
        console.error('Error exporting sessions:', error);
      }
    });
  }

  refreshSessions(): void {
    this.loadSessions();
  }
}