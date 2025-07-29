import { Injectable } from '@nestjs/common';

@Injectable()
export class CoachingService {
  private coaches = [
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
      certifications: ['Google UX Design', 'Scrum Master'],
      languages: ['Français', 'Anglais'],
      timezone: 'Europe/Paris',
      isOnline: true,
      responseTime: '< 1h',
      nextAvailableSlot: new Date(Date.now() + 43200000),
      totalSessions: 320,
      successRate: 96
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
      bio: 'Consultant marketing digital avec 6 ans d\'expérience en growth hacking.',
      experience: 6,
      certifications: ['Google Ads', 'Facebook Marketing'],
      languages: ['Français', 'Anglais', 'Espagnol'],
      timezone: 'Europe/Paris',
      isOnline: false,
      responseTime: '< 2h',
      nextAvailableSlot: new Date(Date.now() + 86400000),
      totalSessions: 180,
      successRate: 94
    },
    {
      id: '3',
      name: 'Julie Chen',
      email: 'julie@example.com',
      avatar: '/api/placeholder/64/64',
      specialties: ['Technology', 'Operations', 'Finance'],
      rating: 4.7,
      reviewsCount: 156,
      hourlyRate: 180,
      bio: 'CTO experte en scaling tech avec 10 ans d\'expérience en startup.',
      experience: 10,
      certifications: ['AWS Certified', 'Kubernetes'],
      languages: ['Français', 'Anglais', 'Mandarin'],
      timezone: 'Europe/Paris',
      isOnline: true,
      responseTime: '< 30min',
      nextAvailableSlot: new Date(Date.now() + 21600000),
      totalSessions: 420,
      successRate: 98
    }
  ];

  private sessions = [
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

  private reviews = [
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
    }
  ];

  private availabilities = [
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

  findAllCoaches(filters: any = {}) {
    let result = [...this.coaches];

    if (filters.specialty) {
      result = result.filter(coach =>
        coach.specialties.some(s => s.toLowerCase().includes(filters.specialty.toLowerCase()))
      );
    }

    if (filters.minRating) {
      result = result.filter(coach => coach.rating >= parseFloat(filters.minRating));
    }

    if (filters.maxRate) {
      result = result.filter(coach => coach.hourlyRate <= parseFloat(filters.maxRate));
    }

    return result;
  }

  searchCoaches(searchTerm: string) {
    return this.coaches.filter(coach =>
      coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  findMatchingCoaches(criteria: any) {
    const matchedCoaches = this.coaches.map(coach => {
      let score = 0;

      if (criteria.specialties?.length) {
        const matchingSpecialties = coach.specialties.filter(s =>
          criteria.specialties.some(cs => cs.toLowerCase() === s.toLowerCase())
        );
        score += (matchingSpecialties.length / criteria.specialties.length) * 40;
      }

      if (criteria.experience && coach.experience >= criteria.experience) {
        score += 20;
      }

      if (criteria.maxHourlyRate && coach.hourlyRate <= criteria.maxHourlyRate) {
        score += 15;
      }

      if (criteria.languages?.length) {
        const matchingLanguages = coach.languages.filter(l =>
          criteria.languages.some(cl => cl.toLowerCase() === l.toLowerCase())
        );
        score += (matchingLanguages.length / criteria.languages.length) * 15;
      }

      if (criteria.timezone && coach.timezone === criteria.timezone) {
        score += 10;
      }

      return { ...coach, matchScore: Math.min(score, 100) };
    });

    return matchedCoaches
      .filter(coach => coach.matchScore >= 30)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  findCoachById(id: string) {
    return this.coaches.find(c => c.id === id);
  }

  getCoachAvailability(coachId: string) {
    return this.availabilities.filter(a => a.coachId === coachId);
  }

  getCoachReviews(coachId: string) {
    return this.reviews.filter(r => r.coachId === coachId);
  }

  bookSession(sessionData: any) {
    const newSession = {
      id: Date.now().toString(),
      coachId: sessionData.coachId,
      userId: sessionData.userId,
      date: new Date(sessionData.date),
      duration: sessionData.duration,
      status: 'scheduled',
      topic: sessionData.topic
    };

    this.sessions.push(newSession);

    const availability = this.availabilities.find(a => a.coachId === sessionData.coachId);
    if (availability && sessionData.timeSlot) {
      const slot = availability.timeSlots.find(s => s.start === sessionData.timeSlot.split('-')[0]);
      if (slot) {
        slot.isBooked = true;
      }
    }

    return newSession;
  }

  getUserSessions(userId: string) {
    return this.sessions.filter(s => s.userId === userId);
  }

  getSessionById(id: string) {
    return this.sessions.find(s => s.id === id);
  }

  updateSession(id: string, updateData: any) {
    const sessionIndex = this.sessions.findIndex(s => s.id === id);
    if (sessionIndex !== -1) {
      this.sessions[sessionIndex] = { ...this.sessions[sessionIndex], ...updateData };
      return this.sessions[sessionIndex];
    }
    return null;
  }

  cancelSession(id: string) {
    const sessionIndex = this.sessions.findIndex(s => s.id === id);
    if (sessionIndex !== -1) {
      this.sessions[sessionIndex].status = 'cancelled';
      return { success: true };
    }
    return { success: false };
  }

  createReview(reviewData: any) {
    const newReview = {
      id: Date.now().toString(),
      coachId: reviewData.coachId,
      userId: reviewData.userId,
      userName: reviewData.userName || 'Utilisateur',
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: new Date(),
      sessionTopic: reviewData.sessionTopic
    };

    this.reviews.push(newReview);

    const coachIndex = this.coaches.findIndex(c => c.id === reviewData.coachId);
    if (coachIndex !== -1) {
      const coach = this.coaches[coachIndex];
      const totalRating = (coach.rating * coach.reviewsCount) + reviewData.rating;
      coach.reviewsCount += 1;
      coach.rating = Math.round((totalRating / coach.reviewsCount) * 10) / 10;
    }

    return newReview;
  }

  getDashboardStats(userId: string) {
    const userSessions = this.sessions.filter(s => s.userId === userId);
    const completedSessions = userSessions.filter(s => s.status === 'completed');
    const upcomingSessions = userSessions.filter(s => s.status === 'scheduled');

    return {
      totalSessions: userSessions.length,
      completedSessions: completedSessions.length,
      upcomingSessions: upcomingSessions.length,
      averageRating: completedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / completedSessions.length || 0,
      totalHours: completedSessions.reduce((sum, s) => sum + s.duration, 0) / 60,
      favoriteSpecialties: ['Product Strategy', 'Marketing'],
      monthlyProgress: [
        { month: 'Jan', sessions: 2 },
        { month: 'Feb', sessions: 3 },
        { month: 'Mar', sessions: 1 }
      ]
    };
  }

  sendSessionReminder(sessionId: string, type: string) {
    console.log(`Rappel ${type} envoyé pour la session ${sessionId}`);
    return { success: true };
  }
}