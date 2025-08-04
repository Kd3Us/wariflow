import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachingService } from '../../services/coaching.service';
import { NotificationService } from '../../services/notification.service';
import { CoachCreationTabComponent } from './coach-creation-tab/coach-creation-tab.component';
import { JwtService } from '../../services/jwt.service';

export interface Coach {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  specialties: string[];
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  bio: string;
  experience: number;
  certifications: string[];
  languages: string[];
  timezone: string;
  isOnline: boolean;
  responseTime: string;
  nextAvailableSlot?: Date;
  totalSessions: number;
  successRate: number;
  matchScore?: number;
}

export interface Availability {
  coachId: string;
  date: Date;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
  isBooked: boolean;
  price: number;
}

export interface Session {
  id: string;
  coachId: string;
  userId: string;
  date: Date;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  topic: string;
  notes?: string;
  rating?: number;
  feedback?: string;
}

export interface Review {
  id: string;
  coachId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
  sessionTopic: string;
}

export interface MatchingCriteria {
  specialties: string[];
  experience: number;
  maxHourlyRate: number;
  languages: string[];
  timezone: string;
  availability: string;
}

@Component({
  selector: 'app-coach-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, CoachCreationTabComponent],
  templateUrl: './coach-manager.component.html',
  styleUrls: ['./coach-manager.component.css']
})
export class CoachManagerComponent implements OnInit {
  coaches: Coach[] = [];
  filteredCoaches: Coach[] = [];
  selectedCoach: Coach | null = null;
  showCoachModal: boolean = false;
  lastSelectedCoach: Coach | null = null;
  availabilities: Availability[] = [];
  sessions: Session[] = [];
  reviews: Review[] = [];
  matchingCriteria: MatchingCriteria = {
    specialties: [],
    experience: 0,
    maxHourlyRate: 500,
    languages: [],
    timezone: 'Europe/Paris',
    availability: 'any'
  };
  
  searchTerm: string = '';
  filterSpecialty: string = '';
  showFilters: boolean = false;
  viewMode: 'browse' | 'matched' | 'calendar' | 'history' | 'admin' = 'browse';
  showBookingModal: boolean = false;
  selectedTimeSlot: { date: Date; slot: TimeSlot } | null = null;

  // Nouvelles propriétés pour l'admin
  isUserAdmin = false;

  // États de chargement
  isLoadingCoaches: boolean = false;
  isLoadingAvailabilities: boolean = false;
  isLoadingSessions: boolean = false;
  isLoadingReviews: boolean = false;
  isBookingSession: boolean = false;

  specialties: string[] = [
    'Product Strategy', 'UX/UI Design', 'Marketing', 'Sales', 
    'Technology', 'Leadership', 'Finance', 'Operations',
    'Business Development', 'Digital Marketing', 'E-commerce'
  ];

  constructor(
    private coachingService: CoachingService,
    private notificationService: NotificationService,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.checkAdminRights();
    this.loadCoaches();
    this.loadAvailabilities();
    this.loadSessions();
    this.loadReviews();
  }

  private checkAdminRights(): void {
    const decodedToken = this.jwtService.decodeToken();
    
    if (!decodedToken) {
      this.isUserAdmin = false;
      return;
    }

    this.isUserAdmin = true ;
     // decodedToken['role'] === 'admin' || 
     // decodedToken['role'] === 'ADMIN' ||
     // decodedToken['isAdmin'] === true ||
     // (Array.isArray(decodedToken['roles']) && decodedToken['roles'].includes('admin'));
  }

  setActiveTab(tab: string): void {
    this.viewMode = tab as 'browse' | 'matched' | 'calendar' | 'history' | 'admin';
  }

  onCoachCreated(coach: any): void {
    console.log('Coach créé:', coach);
    // Recharger la liste des coachs
    this.loadCoaches();
  }

  onCoachDeleted(coach: any): void {
    console.log('Coach supprimé depuis le composant enfant:', coach);
    this.deleteCoach(coach);
  }

  deleteCoach(coach: Coach): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le coach ${coach.name} ?`)) {
      return;
    }

    this.coachingService.deleteCoach(coach.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(
            'Coach supprimé',
            response.message
          );
          this.loadCoaches();
        } else {
          this.notificationService.error(
            'Erreur de suppression',
            response.message
          );
        }
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.notificationService.error(
          'Erreur de suppression',
          'Impossible de supprimer le coach'
        );
      }
    });
  }
  

  loadCoaches(): void {
    console.log('Loading coaches from API...');
    this.isLoadingCoaches = true;
    
    this.coachingService.getAllCoaches().subscribe({
      next: (coaches) => {
        console.log('Coaches loaded successfully:', coaches);
        this.coaches = coaches;
        this.filteredCoaches = coaches;
        this.isLoadingCoaches = false;
        
        if (coaches.length > 0) {
          this.notificationService.success(
            'Coaches chargés',
            `${coaches.length} coach(s) disponible(s)`
          );
        }
      },
      error: (error) => {
        console.error('Error loading coaches from API:', error);
        this.isLoadingCoaches = false;
        this.notificationService.error(
          'Erreur de chargement',
          'Impossible de charger les coaches. Vérifiez votre connexion.'
        );
      }
    });
  }

  loadAvailabilities(): void {
    if (!this.selectedCoach) return;
    
    console.log('Loading availabilities for coach:', this.selectedCoach.id);
    this.isLoadingAvailabilities = true;
    
    this.coachingService.getCoachAvailability(this.selectedCoach.id).subscribe({
      next: (availabilities) => {
        console.log('Availabilities loaded successfully:', availabilities);
        this.availabilities = [{
          coachId: this.selectedCoach!.id,
          date: new Date(),
          timeSlots: availabilities.map(av => ({
            start: av.startTime,
            end: av.endTime,
            isBooked: av.isBooked,
            price: av.price
          }))
        }];
        this.isLoadingAvailabilities = false;
      },
      error: (error) => {
        console.error('Error loading availabilities:', error);
        this.isLoadingAvailabilities = false;
        this.notificationService.warning(
          'Disponibilités indisponibles',
          'Impossible de charger les créneaux du coach.'
        );
      }
    });
  }

  loadSessions(): void {
    console.log('Loading user sessions...');
    this.isLoadingSessions = true;
    
    this.coachingService.getUserSessions().subscribe({
      next: (sessions) => {
        console.log('Sessions loaded successfully:', sessions);
        this.sessions = sessions;
        this.isLoadingSessions = false;
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.isLoadingSessions = false;
        this.notificationService.warning(
          'Historique indisponible',
          'Impossible de charger vos sessions.'
        );
      }
    });
  }

  loadReviews(): void {
    if (!this.selectedCoach) return;
    
    console.log('Loading reviews for coach:', this.selectedCoach.id);
    this.isLoadingReviews = true;
    
    this.coachingService.getCoachReviews(this.selectedCoach.id).subscribe({
      next: (reviews) => {
        console.log('Reviews loaded successfully:', reviews);
        this.reviews = reviews;
        this.isLoadingReviews = false;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.isLoadingReviews = false;
        this.notificationService.warning(
          'Avis indisponibles',
          'Impossible de charger les avis du coach.'
        );
      }
    });
  }

  // Méthode améliorée pour vérifier la disponibilité en temps réel
  checkSlotAvailability(coachId: string, slot: TimeSlot): void {
    this.coachingService.getCoachAvailability(coachId).subscribe({
      next: (availabilities) => {
        const currentAvailability = availabilities.find(av => av.startTime === slot.start);
        if (currentAvailability && currentAvailability.isBooked) {
          // Le créneau a été réservé par quelqu'un d'autre
          this.notificationService.warning(
            'Créneau indisponible',
            'Ce créneau vient d\'être réservé par un autre utilisateur'
          );
          this.loadAvailabilities(); // Recharger les disponibilités
          this.closeBookingModal();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la vérification:', error);
      }
    });
  }

  // Méthode pour marquer un slot comme réservé immédiatement (mise à jour optimiste)
  private markSlotAsBooked(slot: TimeSlot): void {
    this.availabilities.forEach(availability => {
      availability.timeSlots.forEach(timeSlot => {
        if (timeSlot.start === slot.start && timeSlot.end === slot.end) {
          timeSlot.isBooked = true;
        }
      });
    });
  }

  // Méthode pour rafraîchir automatiquement les disponibilités
  private autoRefreshAvailabilities(): void {
    if (this.selectedCoach) {
      // Rafraîchir toutes les 30 secondes quand un coach est sélectionné
      const refreshInterval = setInterval(() => {
        if (this.selectedCoach && this.showCoachModal) {
          this.loadAvailabilities();
        } else {
          clearInterval(refreshInterval);
        }
      }, 30000);
    }
  }

  onSearchChange(): void {
    this.searchCoaches();
  }

  onSpecialtyFilterChange(): void {
    this.filterBySpecialty();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  getCoachFromSession(session: Session): Coach | undefined {
    return this.coaches.find(coach => coach.id === session.coachId);
  }

  getCoachReviews(coachId: string): Review[] {
    return this.reviews.filter(review => review.coachId === coachId);
  }

  goToCalendar(): void {
    this.setViewMode('calendar');
  }

  // Méthode améliorée de réservation avec vérifications
  bookSession(topic: string): void {
    if (!this.selectedCoach || !this.selectedTimeSlot || !topic.trim()) {
      this.notificationService.warning(
        'Informations manquantes',
        'Veuillez remplir tous les champs requis'
      );
      return;
    }

    // Vérification finale avant envoi
    if (this.selectedTimeSlot.slot.isBooked) {
      this.notificationService.error(
        'Créneau indisponible',
        'Ce créneau n\'est plus disponible'
      );
      this.closeBookingModal();
      this.loadAvailabilities();
      return;
    }

    this.isBookingSession = true;

    const sessionData = {
      coachId: this.selectedCoach.id,
      userId: 'current-user', // À remplacer par l'ID utilisateur réel
      date: this.selectedTimeSlot.date.toISOString(),
      startTime: this.selectedTimeSlot.slot.start,
      endTime: this.selectedTimeSlot.slot.end,
      topic: topic,
      duration: 60
    };

    this.coachingService.bookSession(sessionData).subscribe({
      next: (session) => {
        console.log('Session réservée:', session);
        this.isBookingSession = false;
        
        // Marquer immédiatement le slot comme réservé (optimistic update)
        this.markSlotAsBooked(this.selectedTimeSlot!.slot);
        
        this.notificationService.success(
          'Session réservée !',
          `Votre session avec ${this.selectedCoach!.name} est confirmée`
        );
        
        this.closeBookingModal();
        
        // Recharger les données pour synchroniser
        this.loadSessions();
        setTimeout(() => {
          this.loadAvailabilities(); // Délai pour laisser le backend se synchroniser
        }, 500);
      },
      error: (error) => {
        console.error('Erreur lors de la réservation:', error);
        this.isBookingSession = false;
        
        let errorMessage = 'Impossible de réserver la session. Veuillez réessayer.';
        if (error.error?.message?.includes('plus disponible')) {
          errorMessage = 'Ce créneau n\'est plus disponible.';
          this.loadAvailabilities(); // Recharger pour voir l'état actuel
        }
        
        this.notificationService.error('Erreur de réservation', errorMessage);
      }
    });
  }

  searchCoaches(): void {
    if (this.searchTerm.trim()) {
      this.coachingService.searchCoaches(this.searchTerm).subscribe({
        next: (coaches) => {
          this.filteredCoaches = coaches;
        },
        error: (error) => {
          console.error('Erreur lors de la recherche:', error);
          this.notificationService.warning(
            'Erreur de recherche',
            'Impossible de rechercher les coaches. Utilisation du filtre local.'
          );
          this.filterCoachesLocally();
        }
      });
    } else {
      this.filteredCoaches = this.coaches;
    }
  }

  private filterCoachesLocally(): void {
    this.filteredCoaches = this.coaches.filter(coach =>
      coach.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      coach.specialties.some(s => s.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  filterBySpecialty(): void {
    if (this.filterSpecialty) {
      this.filteredCoaches = this.coaches.filter(coach =>
        coach.specialties.some(s => s.toLowerCase().includes(this.filterSpecialty.toLowerCase()))
      );
    } else {
      this.filteredCoaches = this.coaches;
    }
  }

  toggleSpecialtyFilter(specialty: string): void {
    const index = this.matchingCriteria.specialties.indexOf(specialty);
    if (index > -1) {
      this.matchingCriteria.specialties.splice(index, 1);
    } else {
      this.matchingCriteria.specialties.push(specialty);
    }
  }

  isSpecialtySelected(specialty: string): boolean {
    return this.matchingCriteria.specialties.includes(specialty);
  }

  findMatchingCoaches(): void {
    if (this.matchingCriteria.specialties.length === 0) {
      this.notificationService.warning(
        'Sélection manquante',
        'Veuillez sélectionner au moins une spécialité'
      );
      return;
    }

    this.coachingService.findMatchingCoaches(this.matchingCriteria).subscribe({
      next: (coaches) => {
        this.filteredCoaches = coaches;
        this.viewMode = 'matched';
        this.notificationService.success(
          'Coaches correspondants',
          `${coaches.length} coach(s) trouvé(s) selon vos critères`
        );
      },
      error: (error) => {
        console.error('Erreur lors de la recherche de coaches:', error);
        this.notificationService.warning(
          'Erreur de matching',
          'Utilisation de l\'algorithme local de correspondance'
        );
        this.getMatchedCoachesLocally();
      }
    });
  }

  private getMatchedCoachesLocally(): void {
    const matchedCoaches = this.coaches.map(coach => {
      let score = 0;

      if (this.matchingCriteria.specialties.length) {
        const matchingSpecialties = coach.specialties.filter(s =>
          this.matchingCriteria.specialties.some(cs => cs.toLowerCase() === s.toLowerCase())
        );
        score += (matchingSpecialties.length / this.matchingCriteria.specialties.length) * 40;
      }

      if (this.matchingCriteria.experience && coach.experience >= this.matchingCriteria.experience) {
        score += 20;
      }

      if (this.matchingCriteria.maxHourlyRate && coach.hourlyRate <= this.matchingCriteria.maxHourlyRate) {
        score += 15;
      }

      if (this.matchingCriteria.languages?.length) {
        const matchingLanguages = coach.languages.filter(l =>
          this.matchingCriteria.languages.some(cl => cl.toLowerCase() === l.toLowerCase())
        );
        score += (matchingLanguages.length / this.matchingCriteria.languages.length) * 15;
      }

      if (this.matchingCriteria.timezone && coach.timezone === this.matchingCriteria.timezone) {
        score += 10;
      }

      return { ...coach, matchScore: Math.min(score, 100) };
    });

    this.filteredCoaches = matchedCoaches
      .filter(coach => coach.matchScore >= 30)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    
    this.viewMode = 'matched';
  }

  getMatchedCoaches(): Coach[] {
    return this.filteredCoaches.filter(coach => coach.matchScore !== undefined);
  }

  // Modifier la méthode selectCoach pour inclure le rafraîchissement auto
  selectCoach(coach: Coach): void {
    this.selectedCoach = coach;
    this.lastSelectedCoach = coach;
    this.showCoachModal = true;
    this.loadAvailabilities();
    this.loadReviews();
    
    // Démarrer le rafraîchissement automatique
    this.autoRefreshAvailabilities();
  }

  closeCoachProfile(): void {
    this.showCoachModal = false;
    this.selectedCoach = null;
  }

  closeModal(): void {
    this.showCoachModal = false;
  }

  // Méthode améliorée pour ouvrir le modal de réservation
  openBookingModal(date: Date, slot: TimeSlot): void {
    if (slot.isBooked) {
      this.notificationService.info(
        'Créneau réservé',
        'Ce créneau n\'est plus disponible'
      );
      return;
    }

    // Vérifier la disponibilité en temps réel avant d'ouvrir le modal
    if (this.selectedCoach) {
      this.checkSlotAvailability(this.selectedCoach.id, slot);
    }

    this.selectedTimeSlot = { date, slot };
    this.showBookingModal = true;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.selectedTimeSlot = null;
  }

  confirmBooking(topic: string): void {
    this.bookSession(topic);
  }

  cancelSession(sessionId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette session ?')) {
      return;
    }

    this.coachingService.cancelSession(sessionId).subscribe({
      next: () => {
        console.log('Session annulée');
        this.notificationService.info(
          'Session annulée',
          'Votre session a été annulée avec succès'
        );
        this.loadSessions();
        // Recharger les disponibilités pour rendre le créneau à nouveau disponible
        if (this.selectedCoach) {
          this.loadAvailabilities();
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'annulation:', error);
        this.notificationService.error(
          'Erreur d\'annulation',
          'Impossible d\'annuler la session'
        );
      }
    });
  }

  getCoachAvailability(coachId: string): Availability | undefined {
    return this.availabilities.find(a => a.coachId === coachId);
  }

  getUserSessions(): Session[] {
    return this.sessions.filter(s => s.status === 'scheduled').sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  getSessionHistory(): Session[] {
    return this.sessions.filter(s => s.status === 'completed' || s.status === 'cancelled').sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  renderStars(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
  }

  getCoachName(coachId: string): string {
    const coach = this.coaches.find(c => c.id === coachId);
    return coach ? coach.name : 'Coach inconnu';
  }

  setViewMode(mode: 'browse' | 'matched' | 'calendar' | 'history' | 'admin'): void {
    this.viewMode = mode;
    if (mode === 'browse') {
      this.filteredCoaches = this.coaches;
    }
  }
}