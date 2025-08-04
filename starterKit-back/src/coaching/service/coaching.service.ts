import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Coach } from '../entities/coach.entity';
import { Session, SessionStatus } from '../entities/session.entity';
import { Review } from '../entities/review.entity';
import { Availability } from '../entities/availability.entity';
import { SessionHistoryService } from './session-history.service';
import { CreateCoachDto } from '../dto/create-coach.dto';


@Injectable()
export class CoachingService implements OnModuleInit {
  constructor(
    @InjectRepository(Coach)
    private coachRepository: Repository<Coach>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    private sessionHistoryService: SessionHistoryService,
  ) {}

  async onModuleInit() {
    await this.initializeCoaches();
  }

  private async initializeCoaches() {
    const count = await this.coachRepository.count();
    if (count === 0) {
      console.log('Initialisation des coaches par défaut...');
      const initialCoaches = [
        {
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

      for (const coachData of initialCoaches) {
        const coach = this.coachRepository.create(coachData);
        await this.coachRepository.save(coach);
      }

      await this.initializeAvailabilities();
    }
  }

  private async initializeAvailabilities() {
    const coaches = await this.coachRepository.find();
    const today = new Date();
    
    for (const coach of coaches) {
      const availabilities = [
        {
          coachId: coach.id,
          date: today,
          startTime: '09:00',
          endTime: '10:00',
          isBooked: false,
          price: coach.hourlyRate
        },
        {
          coachId: coach.id,
          date: today,
          startTime: '10:00',
          endTime: '11:00',
          isBooked: Math.random() > 0.7,
          price: coach.hourlyRate
        },
        {
          coachId: coach.id,
          date: today,
          startTime: '14:00',
          endTime: '15:00',
          isBooked: false,
          price: coach.hourlyRate
        },
        {
          coachId: coach.id,
          date: today,
          startTime: '15:00',
          endTime: '16:00',
          isBooked: false,
          price: coach.hourlyRate
        }
      ];

      for (const availabilityData of availabilities) {
        const availability = this.availabilityRepository.create(availabilityData);
        await this.availabilityRepository.save(availability);
      }
    }
  }

  async findAllCoaches(filters: any = {}) {
    const queryBuilder = this.coachRepository.createQueryBuilder('coach');

    if (filters.specialty) {
      queryBuilder.andWhere(':specialty = ANY(coach.specialties)', {
        specialty: filters.specialty
      });
    }

    if (filters.minRating) {
      queryBuilder.andWhere('coach.rating >= :minRating', {
        minRating: parseFloat(filters.minRating)
      });
    }

    if (filters.maxRate) {
      queryBuilder.andWhere('coach.hourlyRate <= :maxRate', {
        maxRate: parseFloat(filters.maxRate)
      });
    }

    return await queryBuilder.getMany();
  }

  async searchCoaches(searchTerm: string) {
    return await this.coachRepository
      .createQueryBuilder('coach')
      .where('coach.name ILIKE :term', { term: `%${searchTerm}%` })
      .orWhere('coach.bio ILIKE :term', { term: `%${searchTerm}%` })
      .orWhere('array_to_string(coach.specialties, \',\') ILIKE :term', { term: `%${searchTerm}%` })
      .getMany();
  }

  async findMatchingCoaches(criteria: any) {
    const coaches = await this.coachRepository.find();
    
    const matchedCoaches = coaches.map(coach => {
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

  async findCoachById(id: string) {
    return await this.coachRepository.findOne({
      where: { id },
      relations: ['sessions', 'reviews', 'availabilities']
    });
  }

  async getCoachAvailability(coachId: string) {
    return await this.availabilityRepository.find({
      where: { coachId },
      order: { date: 'ASC', startTime: 'ASC' }
    });
  }

  async getCoachReviews(coachId: string) {
    return await this.reviewRepository.find({
      where: { coachId },
      order: { date: 'DESC' }
    });
  }

  async bookSession(sessionData: any) {
    console.log('Booking session with data:', sessionData);
    
    const availability = await this.availabilityRepository.findOne({
      where: {
        coachId: sessionData.coachId,
        startTime: sessionData.timeSlot?.start || sessionData.startTime,
        isBooked: false
      }
    });

    if (!availability) {
      throw new Error('Ce créneau n\'est plus disponible');
    }

    const coach = await this.findCoachById(sessionData.coachId);
    if (!coach) {
      throw new Error('Coach introuvable');
    }

    const session = this.sessionRepository.create({
      coachId: sessionData.coachId,
      userId: sessionData.userId,
      date: new Date(sessionData.date),
      duration: sessionData.duration || 60,
      status: SessionStatus.SCHEDULED,
      topic: sessionData.topic
    });

    const savedSession = await this.sessionRepository.save(session);

    availability.isBooked = true;
    await this.availabilityRepository.save(availability);

    await this.sessionHistoryService.createSessionHistory({
      sessionId: savedSession.id,
      coachId: sessionData.coachId,
      userId: sessionData.userId,
      coachName: coach.name,
      date: new Date(sessionData.date),
      duration: sessionData.duration || 60,
      topic: sessionData.topic
    });

    console.log('Session booked and availability updated:', savedSession.id);
    return savedSession;
  }

  async completeSession(sessionId: string, completionData: {
    notes?: string;
    rating?: number;
    feedback?: string;
    objectives?: string[];
    outcomes?: string[];
    nextSteps?: string[];
  }) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new Error('Session introuvable');
    }

    session.status = SessionStatus.COMPLETED;
    if (completionData.notes) session.notes = completionData.notes;
    if (completionData.rating) session.rating = completionData.rating;
    if (completionData.feedback) session.feedback = completionData.feedback;

    const updatedSession = await this.sessionRepository.save(session);

    if (completionData.rating || completionData.feedback) {
      await this.sessionHistoryService.addFeedback(sessionId, {
        rating: completionData.rating || 0,
        feedback: completionData.feedback || '',
        objectives: completionData.objectives || [],
        outcomes: completionData.outcomes || [],
        nextSteps: completionData.nextSteps || []
      });
    }

    return updatedSession;
  }

  async getUserSessions(userId: string) {
    return await this.sessionRepository.find({
      where: { userId },
      relations: ['coach'],
      order: { date: 'DESC' }
    });
  }

  async getSessionById(id: string) {
    return await this.sessionRepository.findOne({
      where: { id },
      relations: ['coach']
    });
  }

  async updateSession(id: string, updateData: any) {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) return null;

    Object.assign(session, updateData);
    return await this.sessionRepository.save(session);
  }

  async cancelSession(id: string) {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) return { success: false };

    session.status = SessionStatus.CANCELLED;
    await this.sessionRepository.save(session);
    
    const availability = await this.availabilityRepository.findOne({
      where: { coachId: session.coachId, isBooked: true }
    });
    
    if (availability) {
      availability.isBooked = false;
      await this.availabilityRepository.save(availability);
    }
    
    return { success: true };
  }

  async createReview(reviewData: any) {
    const review = this.reviewRepository.create({
      coachId: reviewData.coachId,
      userId: reviewData.userId,
      userName: reviewData.userName || 'Utilisateur',
      rating: reviewData.rating,
      comment: reviewData.comment,
      sessionTopic: reviewData.sessionTopic
    });

    const savedReview = await this.reviewRepository.save(review);

    const coach = await this.coachRepository.findOne({
      where: { id: reviewData.coachId }
    });

    if (coach) {
      const totalRating = (coach.rating * coach.reviewsCount) + reviewData.rating;
      coach.reviewsCount += 1;
      coach.rating = Math.round((totalRating / coach.reviewsCount) * 10) / 10;
      await this.coachRepository.save(coach);
    }

    return savedReview;
  }

  async getDashboardStats(userId: string) {
    const userSessions = await this.sessionRepository.find({
      where: { userId },
      relations: ['coach']
    });

    const completedSessions = userSessions.filter(s => s.status === SessionStatus.COMPLETED);
    const upcomingSessions = userSessions.filter(s => s.status === SessionStatus.SCHEDULED);

    const averageRating = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / completedSessions.length
      : 0;

    const totalHours = completedSessions.reduce((sum, s) => sum + s.duration, 0) / 60;

    const specialtyCount = {};
    completedSessions.forEach(session => {
      session.coach.specialties.forEach(specialty => {
        specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
      });
    });

    const favoriteSpecialties = Object.entries(specialtyCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([specialty]) => specialty);

    const monthlyStats = await this.getMonthlySessionStats(userId);

    const historyStats = await this.sessionHistoryService.getDashboardStats(userId);

    return {
      totalSessions: userSessions.length,
      completedSessions: completedSessions.length,
      upcomingSessions: upcomingSessions.length,
      averageRating,
      totalHours,
      favoriteSpecialties,
      monthlyProgress: monthlyStats,
      detailedStats: historyStats
    };
  }

  async createCoach(createCoachDto: CreateCoachDto): Promise<Coach> {
    const coach = this.coachRepository.create({
      ...createCoachDto,
      rating: 0,
      reviewsCount: 0,
      isOnline: false,
      totalSessions: 0,
      successRate: 0,
      certifications: createCoachDto.certifications || [],
    });

    return await this.coachRepository.save(coach);
  }

  async getAllCoaches(): Promise<Coach[]> {
    return await this.coachRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  private async getMonthlySessionStats(userId: string) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const stats = [];
    
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0);
      
      const count = await this.sessionRepository.count({
        where: {
          userId,
          date: Between(monthStart, monthEnd)
        }
      });
      
      stats.push({
        month: months[i],
        sessions: count
      });
    }
    
    return stats;
  }

  async deleteCoach(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const coach = await this.coachRepository.findOne({ where: { id } });
      
      if (!coach) {
        return { success: false, message: 'Coach non trouvé' };
      }

      // Vérifier s'il y a des sessions en cours
      const activeSessions = await this.sessionRepository.find({
        where: { 
          coachId: id, 
          status: SessionStatus.SCHEDULED 
        }
      });

      if (activeSessions.length > 0) {
        return { 
          success: false, 
          message: 'Impossible de supprimer un coach avec des sessions programmées' 
        };
      }

      await this.coachRepository.remove(coach);
      
      return { success: true, message: 'Coach supprimé avec succès' };
    } catch (error) {
      console.error('Erreur lors de la suppression du coach:', error);
      return { success: false, message: 'Erreur lors de la suppression' };
    }
  }

  async sendSessionReminder(sessionId: string, type: string) {
    console.log(`Rappel ${type} envoyé pour la session ${sessionId}`);
    return { success: true };
  }

  async getSessionHistory(userId: string, filters?: any) {
    return await this.sessionHistoryService.getUserSessionHistory(userId, filters);
  }

  async addSessionFeedback(sessionId: string, feedbackData: any) {
    return await this.sessionHistoryService.addFeedback(sessionId, feedbackData);
  }

  async createDetailedFeedback(sessionHistoryId: string, feedbackData: any) {
    return await this.sessionHistoryService.createDetailedFeedback(sessionHistoryId, feedbackData);
  }

  async uploadSessionDocument(sessionHistoryId: string, documentData: any) {
    return await this.sessionHistoryService.uploadSessionDocument(sessionHistoryId, documentData);
  }

  async trackSessionProgress(sessionHistoryId: string, progressData: any) {
    return await this.sessionHistoryService.trackProgress(sessionHistoryId, progressData);
  }

  async generateSessionReport(userId: string, filters?: any) {
    return await this.sessionHistoryService.generateSessionReport(userId, filters);
  }

  async exportSessionHistory(userId: string, format: 'json' | 'csv') {
    return await this.sessionHistoryService.exportHistory(userId, format);
  }
}