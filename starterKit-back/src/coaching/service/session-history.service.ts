import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SessionHistory } from '../entities/session-history.entity';
import { Feedback } from '../entities/feedback.entity';
import { SessionDocument } from '../entities/session-document.entity';
import { ProgressTracking } from '../entities/progress-tracking.entity';

@Injectable()
export class SessionHistoryService {
  constructor(
    @InjectRepository(SessionHistory)
    private sessionHistoryRepository: Repository<SessionHistory>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(SessionDocument)
    private sessionDocumentRepository: Repository<SessionDocument>,
    @InjectRepository(ProgressTracking)
    private progressTrackingRepository: Repository<ProgressTracking>,
  ) {}

  async createSessionHistory(sessionData: {
    sessionId: string;
    coachId: string;
    userId: string;
    coachName: string;
    date: Date;
    duration: number;
    topic: string;
    notes?: string;
  }): Promise<SessionHistory> {
    const sessionHistory = this.sessionHistoryRepository.create({
      ...sessionData,
      objectives: [],
      outcomes: [],
      nextSteps: [],
      tags: [],
      status: 'completed'
    });
    
    return await this.sessionHistoryRepository.save(sessionHistory);
  }

  async getUserSessionHistory(userId: string, filters?: {
    coachId?: string;
    startDate?: string;
    endDate?: string;
    topics?: string[];
    tags?: string[];
    minRating?: number;
    status?: string;
  }): Promise<SessionHistory[]> {
    const queryBuilder = this.sessionHistoryRepository
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId });

    if (filters) {
      if (filters.coachId) {
        queryBuilder.andWhere('session.coachId = :coachId', { coachId: filters.coachId });
      }

      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('session.date BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate
        });
      }

      if (filters.topics && filters.topics.length > 0) {
        queryBuilder.andWhere('session.topic = ANY(:topics)', { topics: filters.topics });
      }

      if (filters.tags && filters.tags.length > 0) {
        queryBuilder.andWhere('session.tags && :tags', { tags: filters.tags });
      }

      if (filters.minRating) {
        queryBuilder.andWhere('session.rating >= :minRating', { minRating: filters.minRating });
      }

      if (filters.status) {
        queryBuilder.andWhere('session.status = :status', { status: filters.status });
      }
    }

    return await queryBuilder
      .orderBy('session.date', 'DESC')
      .getMany();
  }

  async getSessionById(id: string): Promise<SessionHistory> {
    const session = await this.sessionHistoryRepository.findOne({ 
      where: { id },
      relations: ['documents', 'progress']
    });
    
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async updateSessionHistory(id: string, updateData: {
    notes?: string;
    objectives?: string[];
    outcomes?: string[];
    nextSteps?: string[];
    tags?: string[];
    progress?: any;
  }): Promise<SessionHistory> {
    const session = await this.getSessionById(id);
    Object.assign(session, updateData);
    return await this.sessionHistoryRepository.save(session);
  }

  async addFeedback(sessionId: string, feedbackData: {
    rating: number;
    feedback: string;
    objectives?: string[];
    outcomes?: string[];
    nextSteps?: string[];
    progress?: any;
  }): Promise<SessionHistory> {
    const session = await this.sessionHistoryRepository.findOne({ 
      where: { sessionId } 
    });
    
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    Object.assign(session, feedbackData);
    return await this.sessionHistoryRepository.save(session);
  }

  async createDetailedFeedback(sessionHistoryId: string, feedbackData: {
    userId: string;
    coachId: string;
    rating: number;
    comment: string;
    categories?: {
      communication: number;
      expertise: number;
      helpfulness: number;
      clarity: number;
      preparation: number;
    };
    positiveAspects?: string[];
    improvementAreas?: string[];
    wouldRecommend?: boolean;
    isPublic?: boolean;
  }): Promise<Feedback> {
    const feedback = this.feedbackRepository.create({
      sessionHistoryId,
      ...feedbackData,
      isVerified: false
    });
    
    return await this.feedbackRepository.save(feedback);
  }

  async addCoachResponse(feedbackId: string, response: string): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({ where: { id: feedbackId } });
    
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
    }

    feedback.coachResponse = response;
    feedback.coachResponseDate = new Date();
    
    return await this.feedbackRepository.save(feedback);
  }

  async uploadSessionDocument(sessionHistoryId: string, documentData: {
    name: string;
    originalName: string;
    url: string;
    mimeType: string;
    size: number;
    type: string;
    uploadedBy: string;
    description?: string;
    tags?: string[];
  }): Promise<SessionDocument> {
    const document = this.sessionDocumentRepository.create({
      sessionHistoryId,
      ...documentData
    });
    
    return await this.sessionDocumentRepository.save(document);
  }

  async getSessionDocuments(sessionHistoryId: string): Promise<SessionDocument[]> {
    return await this.sessionDocumentRepository.find({
      where: { sessionHistoryId, isActive: true },
      order: { uploadDate: 'DESC' }
    });
  }

  async trackProgress(sessionHistoryId: string, progressData: {
    userId: string;
    skillName: string;
    previousLevel?: number;
    currentLevel: number;
    targetLevel?: number;
    achievements?: string[];
    challengesIdentified?: string[];
    actionItems?: string[];
    nextMilestoneDate?: Date;
    coachNotes?: string;
    metrics?: {
      confidenceLevel: number;
      practiceHours: number;
      applicationSuccess: number;
      peerFeedback: number;
    };
  }): Promise<ProgressTracking> {
    const progress = this.progressTrackingRepository.create({
      sessionHistoryId,
      ...progressData,
      previousLevel: progressData.previousLevel || 0,
      targetLevel: progressData.targetLevel || progressData.currentLevel + 20
    });
    
    return await this.progressTrackingRepository.save(progress);
  }

  async getUserProgress(userId: string): Promise<ProgressTracking[]> {
    return await this.progressTrackingRepository.find({
      where: { userId },
      relations: ['sessionHistory'],
      order: { createdAt: 'DESC' }
    });
  }

  async getDashboardStats(userId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageRating: number;
    totalHours: number;
    monthlyProgress: Array<{ month: string; sessions: number; hours: number }>;
    topTopics: Array<{ topic: string; count: number }>;
    skillsProgress: Array<{ skill: string; level: number }>;
  }> {
    const sessions = await this.getUserSessionHistory(userId);
    
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalHours = completedSessions.reduce((sum, s) => sum + s.duration, 0) / 60;
    
    const ratingsSum = completedSessions
      .filter(s => s.rating)
      .reduce((sum, s) => sum + s.rating, 0);
    const averageRating = ratingsSum / completedSessions.filter(s => s.rating).length || 0;

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    }).reverse();

    const monthlyProgress = last6Months.map(date => {
      const month = date.toISOString().slice(0, 7);
      const monthSessions = sessions.filter(s => 
        s.date.toISOString().slice(0, 7) === month
      );
      
      return {
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        sessions: monthSessions.length,
        hours: Math.round(monthSessions.reduce((sum, s) => sum + s.duration, 0) / 60)
      };
    });

    const topicCounts = {};
    sessions.forEach(s => {
      topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1;
    });
    
    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const progressData = await this.getUserProgress(userId);
    const skillsMap = new Map();
    
    progressData.forEach(p => {
      skillsMap.set(p.skillName, p.currentLevel);
    });

    const skillsProgress = Array.from(skillsMap.entries())
      .map(([skill, level]) => ({ skill, level }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 8);

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      averageRating: Math.round(averageRating * 10) / 10,
      totalHours: Math.round(totalHours * 10) / 10,
      monthlyProgress,
      topTopics,
      skillsProgress
    };
  }

  async generateSessionReport(userId: string, filters?: any): Promise<any> {
    const sessions = await this.getUserSessionHistory(userId, filters);
    const stats = await this.getDashboardStats(userId);

    return {
      period: {
        startDate: filters?.startDate || sessions[sessions.length - 1]?.date,
        endDate: filters?.endDate || sessions[0]?.date
      },
      summary: {
        totalSessions: sessions.length,
        totalHours: sessions.reduce((sum, s) => sum + s.duration, 0) / 60,
        averageRating: sessions.filter(s => s.rating).reduce((sum, s) => sum + s.rating, 0) / sessions.filter(s => s.rating).length,
        completionRate: (sessions.filter(s => s.status === 'completed').length / sessions.length) * 100
      },
      topTopics: stats.topTopics,
      skillsProgress: stats.skillsProgress,
      coachesWorkedWith: [...new Set(sessions.map(s => s.coachName))],
      sessions: sessions.map(s => ({
        id: s.id,
        date: s.date,
        coach: s.coachName,
        topic: s.topic,
        duration: s.duration,
        rating: s.rating,
        objectives: s.objectives,
        outcomes: s.outcomes
      }))
    };
  }

  async exportHistory(userId: string, format: 'json' | 'csv'): Promise<any> {
    const sessions = await this.getUserSessionHistory(userId);
    
    if (format === 'csv') {
      const headers = ['Date', 'Coach', 'Topic', 'Duration', 'Rating', 'Status', 'Feedback'];
      const rows = sessions.map(s => [
        s.date.toISOString(),
        s.coachName,
        s.topic,
        s.duration,
        s.rating || '',
        s.status,
        s.feedback || ''
      ]);
      
      return {
        headers,
        rows,
        filename: `session-history-${userId}-${new Date().toISOString().split('T')[0]}.csv`
      };
    }

    return {
      data: sessions,
      filename: `session-history-${userId}-${new Date().toISOString().split('T')[0]}.json`
    };
  }

  async getCoachFeedbacks(coachId: string, options?: {
    limit?: number;
    onlyPublic?: boolean;
  }): Promise<Feedback[]> {
    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .where('feedback.coachId = :coachId', { coachId })
      .leftJoinAndSelect('feedback.sessionHistory', 'sessionHistory')
      .orderBy('feedback.createdAt', 'DESC');

    if (options?.onlyPublic) {
      queryBuilder.andWhere('feedback.isPublic = true');
    }

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    return await queryBuilder.getMany();
  }

  async getUserFeedbacks(userId: string): Promise<Feedback[]> {
    return await this.feedbackRepository.find({
      where: { userId },
      relations: ['sessionHistory'],
      order: { createdAt: 'DESC' }
    });
  }

  async getSessionFeedback(sessionHistoryId: string): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { sessionHistoryId },
      relations: ['sessionHistory']
    });
    
    if (!feedback) {
      throw new NotFoundException(`Feedback for session ${sessionHistoryId} not found`);
    }
    
    return feedback;
  }

  async verifyFeedback(feedbackId: string): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({ where: { id: feedbackId } });
    
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
    }

    feedback.isVerified = true;
    return await this.feedbackRepository.save(feedback);
  }

  async toggleFeedbackVisibility(feedbackId: string, isPublic: boolean): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({ where: { id: feedbackId } });
    
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
    }

    feedback.isPublic = isPublic;
    return await this.feedbackRepository.save(feedback);
  }

  async getCoachFeedbackStats(coachId: string): Promise<any> {
    const feedbacks = await this.getCoachFeedbacks(coachId);
    
    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
      : 0;
    
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: feedbacks.filter(f => f.rating === rating).length
    }));

    const recommendationRate = totalFeedbacks > 0
      ? (feedbacks.filter(f => f.wouldRecommend).length / totalFeedbacks) * 100
      : 0;

    return {
      totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      recommendationRate: Math.round(recommendationRate)
    };
  }

  async getGlobalFeedbackStats(period: string): Promise<any> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const feedbacks = await this.feedbackRepository.find({
      where: {
        createdAt: Between(startDate, new Date())
      }
    });

    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
      : 0;

    return {
      period,
      totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      verifiedFeedbacks: feedbacks.filter(f => f.isVerified).length,
      publicFeedbacks: feedbacks.filter(f => f.isPublic).length
    };
  }

  async getPendingCoachResponses(coachId?: string): Promise<Feedback[]> {
    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .where('feedback.coachResponse IS NULL')
      .leftJoinAndSelect('feedback.sessionHistory', 'sessionHistory')
      .orderBy('feedback.createdAt', 'ASC');

    if (coachId) {
      queryBuilder.andWhere('feedback.coachId = :coachId', { coachId });
    }

    return await queryBuilder.getMany();
  }

  async getRecentFeedbacks(limit: number, verified?: boolean): Promise<Feedback[]> {
    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.sessionHistory', 'sessionHistory')
      .orderBy('feedback.createdAt', 'DESC')
      .limit(limit);

    if (verified !== undefined) {
      queryBuilder.andWhere('feedback.isVerified = :verified', { verified });
    }

    return await queryBuilder.getMany();
  }
}