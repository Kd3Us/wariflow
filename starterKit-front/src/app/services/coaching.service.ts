import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class CoachingService {
  private baseUrl = environment.apiCoachingURL;

  constructor(
    private http: HttpClient,
    private jwtService: JwtService
  ) {
    console.log('CoachingService initialized with baseUrl:', this.baseUrl);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllCoaches(filters?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          httpParams = httpParams.set(key, filters[key]);
        }
      });
    }

    console.log('Fetching coaches from:', `${this.baseUrl}/coaches`);
    return this.http.get<any[]>(`${this.baseUrl}/coaches`, {
      headers: this.getAuthHeaders(),
      params: httpParams
    });
  }

  searchCoaches(searchTerm: string): Observable<any[]> {
    const params = new HttpParams().set('q', searchTerm);
    console.log('Searching coaches with term:', searchTerm);
    return this.http.get<any[]>(`${this.baseUrl}/coaches/search`, {
      headers: this.getAuthHeaders(),
      params: params
    });
  }

  findMatchingCoaches(criteria: any): Observable<any[]> {
    console.log('Finding matching coaches with criteria:', criteria);
    return this.http.post<any[]>(`${this.baseUrl}/coaches/match`, criteria, {
      headers: this.getAuthHeaders()
    });
  }

  getCoachById(id: string): Observable<any> {
    console.log('Fetching coach by ID:', id);
    return this.http.get<any>(`${this.baseUrl}/coaches/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getCoachAvailability(coachId: string): Observable<any[]> {
    console.log('Fetching availability for coach:', coachId);
    return this.http.get<any[]>(`${this.baseUrl}/coaches/${coachId}/availability`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((availabilities: any[]) => availabilities.map((av: any) => ({
        ...av,
        date: new Date(av.date)
      })))
    );
  }

  getCoachReviews(coachId: string): Observable<any[]> {
    console.log('Fetching reviews for coach:', coachId);
    return this.http.get<any[]>(`${this.baseUrl}/coaches/${coachId}/reviews`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((reviews: any[]) => reviews.map((review: any) => ({
        ...review,
        date: new Date(review.date)
      })))
    );
  }

  bookSession(sessionData: any): Observable<any> {
    console.log('Booking session with data:', sessionData);
    
    // Enrichir les données avec les informations utilisateur pour les notifications
    const enrichedSessionData = {
      ...sessionData,
      userName: this.getCurrentUserName(),
      userEmail: this.getCurrentUserEmail(),
      coachName: this.getCoachName(sessionData.coachId)
    };
    
    return this.http.post<any>(`${this.baseUrl}/sessions`, enrichedSessionData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((session: any) => ({
        ...session,
        date: new Date(session.date)
      })),
      tap((session: any) => {
        console.log('Session booked with notifications:', session);
        // Les notifications sont programmées automatiquement par le backend
      })
    );
  }

  getUserSessions(userId: string): Observable<any[]> {
    console.log('Fetching user sessions for userId:', userId);
    return this.http.get<any[]>(`${this.baseUrl}/sessions/user/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((sessions: any[]) => sessions.map((session: any) => ({
        ...session,
        date: new Date(session.date)
      })))
    );
  }

  getSessionById(id: string): Observable<any> {
    console.log('Fetching session by ID:', id);
    return this.http.get<any>(`${this.baseUrl}/sessions/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((session: any) => ({
        ...session,
        date: new Date(session.date)
      }))
    );
  }

  updateSession(id: string, updateData: any): Observable<any> {
    console.log('Updating session:', id, updateData);
    return this.http.put<any>(`${this.baseUrl}/sessions/${id}`, updateData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((session: any) => ({
        ...session,
        date: new Date(session.date)
      }))
    );
  }

  cancelSession(id: string): Observable<any> {
    console.log('Cancelling session:', id);
    return this.http.delete(`${this.baseUrl}/sessions/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Annuler automatiquement les notifications
        this.cancelSessionNotifications(id).catch(error => {
          console.error('Error cancelling notifications:', error);
        });
      })
    );
  }

  createReview(reviewData: any): Observable<any> {
    console.log('Creating review:', reviewData);
    return this.http.post<any>(`${this.baseUrl}/reviews`, reviewData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((review: any) => ({
        ...review,
        date: new Date(review.date)
      }))
    );
  }

  getDashboardStats(userId?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (userId) {
      httpParams = httpParams.set('userId', userId);
    }

    console.log('Fetching dashboard stats for user:', userId);
    return this.http.get<any>(`${this.baseUrl}/stats/dashboard`, {
      headers: this.getAuthHeaders(),
      params: httpParams
    });
  }

  deleteCoach(coachId: string): Observable<any> {
    console.log('Deleting coach:', coachId);
    return this.http.delete(`${this.baseUrl}/coaches/${coachId}`, {
      headers: this.getAuthHeaders()
    });
  }

  sendSessionReminder(sessionId: string, type: string = 'email'): Observable<any> {
    console.log('Sending session reminder for:', sessionId, 'type:', type);
    return this.http.post(`${this.baseUrl}/notifications/reminder`, {
      sessionId,
      type
    }, {
      headers: this.getAuthHeaders()
    });
  }

  // ==================== NOUVELLES MÉTHODES NOTIFICATIONS ====================

  async scheduleSessionNotifications(sessionId: string, sessionData: any): Promise<any> {
    console.log('Programming notifications for session:', sessionId);
    return this.http.post(`${this.baseUrl}/sessions/${sessionId}/notifications/schedule`, sessionData, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  async cancelSessionNotifications(sessionId: string): Promise<any> {
    console.log('Cancelling notifications for session:', sessionId);
    return this.http.delete(`${this.baseUrl}/sessions/${sessionId}/notifications`, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  async rescheduleSessionNotifications(sessionId: string, newSessionData: any): Promise<any> {
    console.log('Rescheduling notifications for session:', sessionId);
    return this.http.put(`${this.baseUrl}/sessions/${sessionId}/notifications/reschedule`, newSessionData, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  async getUserNotificationPreferences(userId: string): Promise<any> {
    console.log('Getting notification preferences for user:', userId);
    return this.http.get(`${this.baseUrl}/users/${userId}/notification-preferences`, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  async updateUserNotificationPreferences(userId: string, preferences: any): Promise<any> {
    console.log('Updating notification preferences for user:', userId);
    return this.http.put(`${this.baseUrl}/users/${userId}/notification-preferences`, preferences, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  private getCurrentUserName(): string {
    return sessionStorage.getItem('userName') || 'Utilisateur';
  }

  private getCurrentUserEmail(): string {
    return sessionStorage.getItem('userEmail') || 'user@example.com';
  }

  private getCoachName(coachId: string): string {
    // Si tu as une liste de coaches en cache, utilise-la
    // Sinon, retourne une valeur par défaut
    return 'Coach';
  }
}