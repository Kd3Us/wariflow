import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachingService } from '../../services/coaching.service';

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
  imports: [CommonModule, FormsModule],
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
  viewMode: 'browse' | 'matched' | 'calendar' | 'history' = 'browse';
  showBookingModal: boolean = false;
  selectedTimeSlot: { date: Date; slot: TimeSlot } | null = null;

  specialties: string[] = [
    'Product Strategy', 'UX/UI Design', 'Marketing', 'Sales', 
    'Technology', 'Leadership', 'Finance', 'Operations',
    'Business Development', 'Digital Marketing', 'E-commerce'
  ];

  constructor(private coachingService: CoachingService) {}

  ngOnInit(): void {
    this.loadCoaches();
    this.loadAvailabilities();
    this.loadSessions();
    this.loadReviews();
  }

  loadCoaches(): void {
    this.coachingService.getAllCoaches().subscribe({
      next: (coaches) => {
        this.coaches = coaches;
        this.filteredCoaches = coaches;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des coaches:', error);
        this.loadMockCoaches();
      }
    });
  }

  private loadMockCoaches(): void {
    const mockCoaches: Coach[] = [
      {
        id: '1',
        name: 'Sarah Martin',
        email: 'sarah@example.com',
        avatar: '/api/placeholder/64/64',
        specialties: ['Product Strategy', 'UX/UI Design', 'Leadership'],
        rating: 4.8,
        reviewsCount: 127,
        hourlyRate: 150,
        bio: 'Expert en stratégie produit avec 8 ans d\'expérience chez des startups tech.',
        experience: 10,
        certifications: ['Google UX Design', 'Scrum Master'],
        languages: ['Français', 'Anglais'],
        timezone: 'Europe/Paris',
        isOnline: true,
        responseTime: '< 1h',
        nextAvailableSlot: new Date(Date.now() + 43200000),
        totalSessions: 520,
        successRate: 98,
        matchScore: 85
      },
      {
        id: '2',
        name: 'Marc Dubois',
        email: 'marc@example.com',
        avatar: '/api/placeholder/64/64',
        specialties: ['Digital Marketing', 'Sales', 'Business Development'],
        rating: 4.6,
        reviewsCount: 89,
        hourlyRate: 120,
        bio: 'Spécialiste en marketing digital et développement commercial avec 6 ans d\'expérience.',
        experience: 6,
        certifications: ['Google Ads', 'HubSpot Sales'],
        languages: ['Français', 'Anglais', 'Espagnol'],
        timezone: 'Europe/Paris',
        isOnline: false,
        responseTime: '< 2h',
        nextAvailableSlot: new Date(Date.now() + 86400000),
        totalSessions: 320,
        successRate: 94,
        matchScore: 72
      },
      {
        id: '3',
        name: 'Julie Lefèvre',
        email: 'julie@example.com',
        avatar: '/api/placeholder/64/64',
        specialties: ['UX/UI Design', 'Technology', 'Product Strategy'],
        rating: 4.9,
        reviewsCount: 156,
        hourlyRate: 180,
        bio: 'Designer UX/UI senior avec une expertise en développement produit et innovation.',
        experience: 12,
        certifications: ['Adobe Certified Expert', 'Design Thinking'],
        languages: ['Français', 'Anglais'],
        timezone: 'Europe/Paris',
        isOnline: true,
        responseTime: '< 30min',
        nextAvailableSlot: new Date(Date.now() + 21600000),
        totalSessions: 680,
        successRate: 99,
        matchScore: 90
      }
    ];
    this.coaches = mockCoaches;
    this.filteredCoaches = mockCoaches;
  }

  loadAvailabilities(): void {
    if (this.selectedCoach) {
      this.coachingService.getCoachAvailability(this.selectedCoach.id).subscribe({
        next: (availabilities) => {
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
        },
        error: (error) => {
          console.error('Erreur lors du chargement des disponibilités:', error);
          this.loadMockAvailabilities();
        }
      });
    } else {
      this.loadMockAvailabilities();
    }
  }

  private loadMockAvailabilities(): void {
    const mockAvailabilities: Availability[] = [
      {
        coachId: '1',
        date: new Date(),
        timeSlots: [
          { start: '09:00', end: '10:00', isBooked: false, price: 150 },
          { start: '10:00', end: '11:00', isBooked: true, price: 150 },
          { start: '14:00', end: '15:00', isBooked: false, price: 150 },
          { start: '15:00', end: '16:00', isBooked: false, price: 150 }
        ]
      },
      {
        coachId: '2',
        date: new Date(),
        timeSlots: [
          { start: '10:00', end: '11:00', isBooked: false, price: 120 },
          { start: '11:00', end: '12:00', isBooked: false, price: 120 },
          { start: '16:00', end: '17:00', isBooked: true, price: 120 }
        ]
      }
    ];
    this.availabilities = mockAvailabilities;
  }

  loadSessions(): void {
    this.coachingService.getUserSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des sessions:', error);
        this.loadMockSessions();
      }
    });
  }

  private loadMockSessions(): void {
    const mockSessions: Session[] = [
      {
        id: '1',
        coachId: '1',
        userId: 'user1',
        date: new Date(Date.now() - 86400000),
        duration: 60,
        status: 'completed',
        topic: 'Stratégie produit',
        notes: 'Session très productive sur la roadmap produit',
        rating: 5,
        feedback: 'Excellent conseil, très structuré'
      },
      {
        id: '2',
        coachId: '2',
        userId: 'user1',
        date: new Date(Date.now() + 86400000),
        duration: 60,
        status: 'scheduled',
        topic: 'Marketing digital'
      }
    ];
    this.sessions = mockSessions;
  }

  loadReviews(): void {
    if (this.selectedCoach) {
      this.coachingService.getCoachReviews(this.selectedCoach.id).subscribe({
        next: (reviews) => {
          this.reviews = reviews;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des avis:', error);
          this.loadMockReviews();
        }
      });
    } else {
      this.loadMockReviews();
    }
  }

  private loadMockReviews(): void {
    const mockReviews: Review[] = [
      {
        id: '1',
        coachId: '1',
        userId: 'user1',
        userName: 'Pierre L.',
        rating: 5,
        comment: 'Sarah m\'a aidé à structurer ma stratégie produit. Très professionnelle et à l\'écoute.',
        date: new Date(Date.now() - 86400000),
        sessionTopic: 'Stratégie produit'
      },
      {
        id: '2',
        coachId: '2',
        userId: 'user2',
        userName: 'Marie D.',
        rating: 5,
        comment: 'Marc a transformé notre approche marketing. ROI visible dès le premier mois.',
        date: new Date(Date.now() - 172800000),
        sessionTopic: 'Marketing digital'
      },
      {
        id: '3',
        coachId: '3',
        userId: 'user3',
        userName: 'Thomas K.',
        rating: 4,
        comment: 'Julie a révolutionné notre interface utilisateur. Approche très méthodique.',
        date: new Date(Date.now() - 259200000),
        sessionTopic: 'Design UX'
      }
    ];
    this.reviews = mockReviews;
  }

  // MÉTHODES MANQUANTES AJOUTÉES

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

  bookSession(topic: string): void {
    if (!this.selectedCoach || !this.selectedTimeSlot || !topic.trim()) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    const sessionData = {
      coachId: this.selectedCoach.id,
      date: this.selectedTimeSlot.date.toISOString(),
      timeSlot: this.selectedTimeSlot.slot,
      topic: topic,
      duration: 60
    };

    this.coachingService.bookSession(sessionData).subscribe({
      next: (session) => {
        console.log('Session réservée:', session);
        this.closeBookingModal();
        this.loadSessions();
        this.loadAvailabilities();
      },
      error: (error) => {
        console.error('Erreur lors de la réservation:', error);
        alert('Erreur lors de la réservation');
      }
    });
  }

  // MÉTHODES EXISTANTES

  searchCoaches(): void {
    if (this.searchTerm.trim()) {
      this.coachingService.searchCoaches(this.searchTerm).subscribe({
        next: (coaches) => {
          this.filteredCoaches = coaches;
        },
        error: (error) => {
          console.error('Erreur lors de la recherche:', error);
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
      alert('Veuillez sélectionner au moins une spécialité');
      return;
    }

    this.coachingService.findMatchingCoaches(this.matchingCriteria).subscribe({
      next: (coaches) => {
        this.filteredCoaches = coaches;
        this.viewMode = 'matched';
      },
      error: (error) => {
        console.error('Erreur lors de la recherche de coaches:', error);
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

  selectCoach(coach: Coach): void {
    this.selectedCoach = coach;
    this.lastSelectedCoach = coach;
    this.showCoachModal = true;
    this.loadAvailabilities();
    this.loadReviews();
  }

  closeCoachProfile(): void {
    this.showCoachModal = false;
    this.selectedCoach = null;
  }

  closeModal(): void {
    this.showCoachModal = false;
  }

  openBookingModal(date: Date, slot: TimeSlot): void {
    if (slot.isBooked) return;
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
    if (confirm('Êtes-vous sûr de vouloir annuler cette session ?')) {
      this.coachingService.cancelSession(sessionId).subscribe({
        next: () => {
          console.log('Session annulée');
          this.loadSessions();
        },
        error: (error) => {
          console.error('Erreur lors de l\'annulation:', error);
          alert('Erreur lors de l\'annulation');
        }
      });
    }
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

  setViewMode(mode: 'browse' | 'matched' | 'calendar' | 'history'): void {
    this.viewMode = mode;
    if (mode === 'browse') {
      this.filteredCoaches = this.coaches;
    }
  }
}