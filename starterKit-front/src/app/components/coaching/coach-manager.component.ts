import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  ngOnInit(): void {
    this.loadCoaches();
    this.loadAvailabilities();
    this.loadSessions();
    this.loadReviews();
  }

  loadCoaches(): void {
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
        experience: 8,
        certifications: ['Certified Product Manager', 'Design Thinking'],
        languages: ['Français', 'Anglais'],
        timezone: 'Europe/Paris',
        isOnline: true,
        responseTime: '< 2h',
        nextAvailableSlot: new Date(Date.now() + 86400000),
        totalSessions: 340,
        successRate: 94
      },
      {
        id: '2',
        name: 'Marc Dubois',
        email: 'marc@example.com',
        avatar: '/api/placeholder/64/64',
        specialties: ['Marketing', 'Sales', 'Business Development'],
        rating: 4.9,
        reviewsCount: 89,
        hourlyRate: 120,
        bio: 'Consultant en marketing digital et growth hacking pour startups.',
        experience: 6,
        certifications: ['Google Ads', 'Facebook Blueprint'],
        languages: ['Français', 'Anglais', 'Espagnol'],
        timezone: 'Europe/Paris',
        isOnline: false,
        responseTime: '< 4h',
        nextAvailableSlot: new Date(Date.now() + 172800000),
        totalSessions: 280,
        successRate: 96
      },
      {
        id: '3',
        name: 'Julie Rousseau',
        email: 'julie@example.com',
        avatar: '/api/placeholder/64/64',
        specialties: ['UX/UI Design', 'Technology', 'Leadership'],
        rating: 4.7,
        reviewsCount: 156,
        hourlyRate: 180,
        bio: 'Designer UX senior et tech lead avec une expertise en design systems.',
        experience: 10,
        certifications: ['Google UX Design', 'Scrum Master'],
        languages: ['Français', 'Anglais'],
        timezone: 'Europe/Paris',
        isOnline: true,
        responseTime: '< 1h',
        nextAvailableSlot: new Date(Date.now() + 43200000),
        totalSessions: 520,
        successRate: 98
      }
    ];
    this.coaches = mockCoaches;
    this.filteredCoaches = mockCoaches;
  }

  loadAvailabilities(): void {
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
        sessionTopic: 'UX Design'
      }
    ];
    this.reviews = mockReviews;
  }

  onSearchChange(): void {
    this.filterAndSearchCoaches();
  }

  onSpecialtyFilterChange(): void {
    this.filterAndSearchCoaches();
  }

  filterAndSearchCoaches(): void {
    let filtered = this.coaches;

    if (this.searchTerm) {
      filtered = filtered.filter(coach =>
        coach.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        coach.specialties.some(specialty => 
          specialty.toLowerCase().includes(this.searchTerm.toLowerCase())
        ) ||
        coach.bio.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.filterSpecialty) {
      filtered = filtered.filter(coach =>
        coach.specialties.includes(this.filterSpecialty)
      );
    }

    this.filteredCoaches = filtered;
  }

  calculateMatchingScore(coach: Coach, criteria: MatchingCriteria): number {
    let score = 0;
    
    const specialtyMatch = criteria.specialties.length === 0 ? 1 : 
      criteria.specialties.filter(s => coach.specialties.includes(s)).length / criteria.specialties.length;
    score += specialtyMatch * 30;

    const experienceMatch = coach.experience >= criteria.experience ? 1 : coach.experience / criteria.experience;
    score += experienceMatch * 20;

    const priceMatch = coach.hourlyRate <= criteria.maxHourlyRate ? 1 : criteria.maxHourlyRate / coach.hourlyRate;
    score += priceMatch * 20;

    const languageMatch = criteria.languages.length === 0 ? 1 :
      criteria.languages.filter(l => coach.languages.includes(l)).length / criteria.languages.length;
    score += languageMatch * 15;

    const ratingBonus = (coach.rating / 5) * 10;
    score += ratingBonus;

    const availabilityBonus = coach.isOnline ? 5 : 0;
    score += availabilityBonus;

    return Math.min(100, score);
  }

  getMatchedCoaches(): Array<Coach & { matchScore: number }> {
    return this.coaches
      .map(coach => ({
        ...coach,
        matchScore: this.calculateMatchingScore(coach, this.matchingCriteria)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  setViewMode(mode: 'browse' | 'matched' | 'calendar' | 'history'): void {
    this.viewMode = mode;
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  selectCoach(coach: Coach): void {
    this.selectedCoach = coach;
  }

  closeCoachProfile(): void {
    this.selectedCoach = null;
  }

  openBookingModal(date: Date, slot: TimeSlot): void {
    this.selectedTimeSlot = { date, slot };
    this.showBookingModal = true;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.selectedTimeSlot = null;
  }

  bookSession(topic: string): void {
    if (!this.selectedCoach || !this.selectedTimeSlot) return;

    const newSession: Session = {
      id: Date.now().toString(),
      coachId: this.selectedCoach.id,
      userId: 'current-user',
      date: this.selectedTimeSlot.date,
      duration: 60,
      status: 'scheduled',
      topic
    };

    this.sessions.push(newSession);
    
    this.availabilities = this.availabilities.map(availability => {
      if (availability.coachId === this.selectedCoach!.id && 
          availability.date.toDateString() === this.selectedTimeSlot!.date.toDateString()) {
        return {
          ...availability,
          timeSlots: availability.timeSlots.map(slot => 
            slot.start === this.selectedTimeSlot!.slot.start ? { ...slot, isBooked: true } : slot
          )
        };
      }
      return availability;
    });

    this.closeBookingModal();
  }

  goToCalendar(): void {
    this.setViewMode('calendar');
    this.closeCoachProfile();
  }

  renderStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  getCoachAvailability(coachId: string): Availability | undefined {
    return this.availabilities.find(a => a.coachId === coachId);
  }

  getCoachReviews(coachId: string): Review[] {
    return this.reviews.filter(r => r.coachId === coachId);
  }

  getCoachFromSession(session: Session): Coach | undefined {
    return this.coaches.find(c => c.id === session.coachId);
  }
}