import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SessionHistory {
  id: string;
  sessionId: string;
  coachId: string;
  userId: string;
  coachName: string;
  date: Date;
  duration: number;
  topic: string;
  notes?: string;
  objectives: string[];
  outcomes: string[];
  rating?: number;
  feedback?: string;
  nextSteps: string[];
  tags: string[];
  progress?: {
    goalsAchieved: number;
    totalGoals: number;
    skillsImproved: string[];
    nextFocusAreas: string[];
  };
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    uploadDate: Date;
  }>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  totalHours: number;
  monthlyProgress: Array<{ month: string; sessions: number; hours: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  skillsProgress: Array<{ skill: string; level: number }>;
}

export interface DetailedFeedback {
  id: string;
  sessionHistoryId: string;
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
  positiveAspects: string[];
  improvementAreas: string[];
  wouldRecommend: boolean;
  coachResponse?: string;
  coachResponseDate?: Date;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface SessionDocument {
  id: string;
  sessionHistoryId: string;
  name: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  type: string;
  uploadedBy: string;
  description?: string;
  tags: string[];
  uploadDate: Date;
}

export interface ProgressTracking {
  id: string;
  userId: string;
  sessionHistoryId: string;
  skillName: string;
  previousLevel: number;
  currentLevel: number;
  targetLevel: number;
  achievements: string[];
  challengesIdentified: string[];
  actionItems: string[];
  nextMilestoneDate?: Date;
  coachNotes?: string;
  metrics?: {
    confidenceLevel: number;
    practiceHours: number;
    applicationSuccess: number;
    peerFeedback: number;
  };
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SessionHistoryService {
  private readonly baseUrl = 'http://localhost:3001/session-history';
  private readonly feedbackUrl = 'http://localhost:3001/feedbacks';

  constructor(private http: HttpClient) {}

  getUserSessionHistory(userId: string, filters?: {
    coachId?: string;
    startDate?: string;
    endDate?: string;
    topics?: string[];
    tags?: string[];
    minRating?: number;
    status?: string;
  }): Observable<SessionHistory[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.coachId) params = params.set('coachId', filters.coachId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.topics?.length) params = params.set('topics', filters.topics.join(','));
      if (filters.tags?.length) params = params.set('tags', filters.tags.join(','));
      if (filters.minRating) params = params.set('minRating', filters.minRating.toString());
      if (filters.status) params = params.set('status', filters.status);
    }

    return this.http.get<SessionHistory[]>(`${this.baseUrl}/user/${userId}`, { params });
  }

  getDashboardStats(userId: string): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/${userId}`);
  }

  getSessionById(id: string): Observable<SessionHistory> {
    return this.http.get<SessionHistory>(`${this.baseUrl}/${id}`);
  }

  updateSessionHistory(id: string, updateData: {
    notes?: string;
    objectives?: string[];
    outcomes?: string[];
    nextSteps?: string[];
    tags?: string[];
    progress?: any;
  }): Observable<SessionHistory> {
    return this.http.put<SessionHistory>(`${this.baseUrl}/${id}`, updateData);
  }

  addFeedback(sessionId: string, feedbackData: {
    rating: number;
    feedback: string;
    objectives?: string[];
    outcomes?: string[];
    nextSteps?: string[];
    progress?: any;
  }): Observable<SessionHistory> {
    return this.http.post<SessionHistory>(`${this.baseUrl}/feedback/${sessionId}`, feedbackData);
  }

  createDetailedFeedback(feedbackData: {
    sessionHistoryId: string;
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
  }): Observable<DetailedFeedback> {
    return this.http.post<DetailedFeedback>(`${this.feedbackUrl}`, feedbackData);
  }

  uploadDocument(sessionHistoryId: string, file: File, documentData: {
    name: string;
    type: string;
    uploadedBy: string;
    description?: string;
    tags?: string[];
  }): Observable<SessionDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', documentData.name);
    formData.append('originalName', file.name);
    formData.append('mimeType', file.type);
    formData.append('size', file.size.toString());
    formData.append('type', documentData.type);
    formData.append('uploadedBy', documentData.uploadedBy);
    
    if (documentData.description) {
      formData.append('description', documentData.description);
    }
    
    if (documentData.tags?.length) {
      formData.append('tags', JSON.stringify(documentData.tags));
    }

    return this.http.post<SessionDocument>(`${this.baseUrl}/${sessionHistoryId}/documents`, formData);
  }

  getSessionDocuments(sessionHistoryId: string): Observable<SessionDocument[]> {
    return this.http.get<SessionDocument[]>(`${this.baseUrl}/${sessionHistoryId}/documents`);
  }

  trackProgress(sessionHistoryId: string, progressData: {
    userId: string;
    skillName: string;
    currentLevel: number;
    previousLevel?: number;
    targetLevel?: number;
    achievements?: string[];
    challengesIdentified?: string[];
    actionItems?: string[];
    nextMilestoneDate?: string;
    coachNotes?: string;
    metrics?: {
      confidenceLevel: number;
      practiceHours: number;
      applicationSuccess: number;
      peerFeedback: number;
    };
  }): Observable<ProgressTracking> {
    return this.http.post<ProgressTracking>(`${this.baseUrl}/${sessionHistoryId}/progress`, progressData);
  }

  getUserProgress(userId: string): Observable<ProgressTracking[]> {
    return this.http.get<ProgressTracking[]>(`${this.baseUrl}/progress/${userId}`);
  }

  generateReport(userId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<any>(`${this.baseUrl}/report/${userId}`, { params });
  }

  exportHistory(userId: string, format: 'json' | 'csv' = 'json'): Observable<any> {
    const params = new HttpParams().set('format', format);
    return this.http.get<any>(`${this.baseUrl}/export/${userId}`, { params });
  }

  getCoachFeedbacks(coachId: string, options?: {
    limit?: number;
    onlyPublic?: boolean;
  }): Observable<DetailedFeedback[]> {
    let params = new HttpParams();
    
    if (options?.limit) params = params.set('limit', options.limit.toString());
    if (options?.onlyPublic) params = params.set('onlyPublic', options.onlyPublic.toString());

    return this.http.get<DetailedFeedback[]>(`${this.feedbackUrl}/coach/${coachId}`, { params });
  }

  getUserFeedbacks(userId: string): Observable<DetailedFeedback[]> {
    return this.http.get<DetailedFeedback[]>(`${this.feedbackUrl}/user/${userId}`);
  }

  getSessionFeedback(sessionHistoryId: string): Observable<DetailedFeedback> {
    return this.http.get<DetailedFeedback>(`${this.feedbackUrl}/session/${sessionHistoryId}`);
  }

  addCoachResponse(feedbackId: string, response: string): Observable<DetailedFeedback> {
    return this.http.post<DetailedFeedback>(`${this.feedbackUrl}/${feedbackId}/coach-response`, { response });
  }

  verifyFeedback(feedbackId: string): Observable<DetailedFeedback> {
    return this.http.put<DetailedFeedback>(`${this.feedbackUrl}/${feedbackId}/verify`, {});
  }

  toggleFeedbackVisibility(feedbackId: string, isPublic: boolean): Observable<DetailedFeedback> {
    return this.http.put<DetailedFeedback>(`${this.feedbackUrl}/${feedbackId}/public`, { isPublic });
  }

  getCoachFeedbackStats(coachId: string): Observable<any> {
    return this.http.get<any>(`${this.feedbackUrl}/stats/coach/${coachId}`);
  }

  getGlobalFeedbackStats(period: string = '30d'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.feedbackUrl}/stats/global`, { params });
  }

  getPendingCoachResponses(coachId?: string): Observable<DetailedFeedback[]> {
    let params = new HttpParams();
    if (coachId) params = params.set('coachId', coachId);
    
    return this.http.get<DetailedFeedback[]>(`${this.feedbackUrl}/pending-responses`, { params });
  }

  getRecentFeedbacks(limit: number = 10, verified?: boolean): Observable<DetailedFeedback[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (verified !== undefined) params = params.set('verified', verified.toString());
    
    return this.http.get<DetailedFeedback[]>(`${this.feedbackUrl}/recent`, { params });
  }

  downloadFile(data: any, filename: string, format: string): void {
    let content: string;
    let mimeType: string;

    if (format === 'csv') {
      const headers = data.headers || [];
      const rows = data.rows || [];
      content = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n');
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(data.data, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}