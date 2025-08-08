import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface ChatMessage {
  id: string;
  ticketId?: string;
  senderId: string;
  senderType: 'user' | 'coach' | 'bot';
  content: string;
  timestamp: Date;
  isRead: boolean;
  messageType: 'text' | 'file' | 'system';
}

export interface SupportTicket {
  id: string;
  userId: string;
  coachId?: string;
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface Coach {
  id: string;
  name: string;
  avatar: string;
  specialties: string[];
  isOnline: boolean;
  rating: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatSupportService {
  private apiUrl = 'http://localhost:3009/api/coaching/support';
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private ticketsSubject = new BehaviorSubject<SupportTicket[]>([]);
  private coachesSubject = new BehaviorSubject<Coach[]>([]);
  
  public messages$ = this.messagesSubject.asObservable();
  public tickets$ = this.ticketsSubject.asObservable();
  public coaches$ = this.coachesSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.startPolling();
    this.loadRealCoaches();
  }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('startupkit_SESSION');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private startPolling(): void {
    interval(5000).subscribe(() => {
      this.refreshData();
    });
  }

  private refreshData(): void {
    const userId = this.getCurrentUserId();
    if (userId && userId !== 'guest-user') {
      this.getUserTickets().subscribe({
        next: (tickets) => this.ticketsSubject.next(tickets),
        error: (error) => console.log('Erreur refresh tickets:', error)
      });
      
      this.getAvailableCoaches().subscribe({
        next: (coaches) => this.coachesSubject.next(coaches),
        error: (error) => console.log('Erreur refresh coaches:', error)
      });
    }
  }

  private loadRealCoaches(): void {
    this.getAvailableCoaches().subscribe({
      next: (coaches) => {
        console.log('Coaches chargés:', coaches);
        this.coachesSubject.next(coaches);
      },
      error: (error) => {
        console.error('Erreur chargement coaches:', error);
        this.coachesSubject.next(this.getMockCoaches());
      }
    });
  }

  createTicket(ticketData: Partial<SupportTicket>): Observable<SupportTicket> {
    const enrichedData = {
      ...ticketData,
      userId: this.getCurrentUserId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    
    return this.http.post<SupportTicket>(
      `${this.apiUrl}/tickets`, 
      enrichedData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(ticket => console.log('Ticket créé:', ticket)),
      catchError(error => {
        console.error('Erreur création ticket:', error);
        return of(this.createMockTicket(enrichedData));
      })
    );
  }

  getUserTickets(): Observable<SupportTicket[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<SupportTicket[]>(
      `${this.apiUrl}/tickets/user/${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur récupération tickets:', error);
        return of([]);
      })
    );
  }

  getTicket(ticketId: string): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(
      `${this.apiUrl}/tickets/${ticketId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur récupération ticket:', error);
        return of(null as any);
      })
    );
  }

  getTicketMessages(ticketId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.apiUrl}/tickets/${ticketId}/messages`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(messages => {
        console.log('Messages récupérés pour ticket:', ticketId, messages);
        this.messagesSubject.next(messages);
      }),
      catchError(error => {
        console.error('Erreur récupération messages:', error);
        return of([]);
      })
    );
  }

  updateTicket(ticketId: string, updateData: Partial<SupportTicket>): Observable<SupportTicket> {
    return this.http.patch<SupportTicket>(
      `${this.apiUrl}/tickets/${ticketId}`, 
      updateData,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur mise à jour ticket:', error);
        return of(null as any);
      })
    );
  }

  sendMessage(ticketId: string, content: string): Observable<ChatMessage> {
    const messageData = {
      ticketId,
      senderId: this.getCurrentUserId(),
      senderType: 'user' as const,
      content,
      messageType: 'text' as const,
      timestamp: new Date(),
      isRead: false
    };
    
    return this.http.post<ChatMessage>(
      `${this.apiUrl}/messages`, 
      messageData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(msg => {
        console.log('Message envoyé:', msg);
        this.addMessage(msg);
      }),
      catchError(error => {
        console.error('Erreur envoi message:', error);
        const mockMessage = this.createMockMessage(messageData);
        this.addMessage(mockMessage);
        return of(mockMessage);
      })
    );
  }

  getAvailableCoaches(): Observable<Coach[]> {
    return this.http.get<Coach[]>(
      `${this.apiUrl}/coaches/available`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur récupération coaches:', error);
        return of(this.getMockCoaches());
      })
    );
  }

  assignCoach(ticketId: string, coachId?: string): Observable<SupportTicket> {
    return this.http.patch<SupportTicket>(
      `${this.apiUrl}/tickets/${ticketId}/assign`, 
      { coachId },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur assignation coach:', error);
        return of(null as any);
      })
    );
  }

  addMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  setMessages(messages: ChatMessage[]): void {
    this.messagesSubject.next(messages);
  }

  updateTicketInList(ticket: SupportTicket): void {
    const currentTickets = this.ticketsSubject.value;
    const index = currentTickets.findIndex(t => t.id === ticket.id);
    if (index !== -1) {
      currentTickets[index] = ticket;
    } else {
      currentTickets.push(ticket);
    }
    this.ticketsSubject.next([...currentTickets]);
  }

  private getCurrentUserId(): string {
    const token = sessionStorage.getItem('startupkit_SESSION');
    if (!token) {
      console.warn('No token found, using guest user');
      return 'guest-user';
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.id || payload.userId || 'guest-user';
    } catch (error) {
      console.error('Error parsing token:', error);
      return 'guest-user';
    }
  }

  simulateBotResponse(userMessage: string): ChatMessage {
    let botResponse = '';
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('problème') || lowerMessage.includes('bug')) {
      botResponse = 'Je comprends que vous rencontrez un problème technique. Pouvez-vous me donner plus de détails ?';
    } else if (lowerMessage.includes('coaching')) {
      botResponse = 'Pour vos questions sur le coaching, je peux vous mettre en relation avec un coach spécialisé.';
    } else if (lowerMessage.includes('facture') || lowerMessage.includes('prix')) {
      botResponse = 'Pour toute question concernant la facturation, notre équipe peut vous aider.';
    } else if (lowerMessage.includes('coach') || lowerMessage.includes('humain')) {
      botResponse = 'Je vous mets en relation avec un coach humain. Veuillez patienter...';
    } else {
      botResponse = 'Je vais transférer votre demande à un coach humain qui pourra mieux vous aider.';
    }

    return {
      id: this.generateId(),
      senderId: 'bot',
      senderType: 'bot',
      content: botResponse,
      timestamp: new Date(),
      isRead: false,
      messageType: 'text'
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getMockCoaches(): Coach[] {
    return [
      {
        id: '1',
        name: 'Sophie Martin',
        avatar: 'assets/avatars/coach1.jpg',
        specialties: ['Leadership', 'Gestion du stress'],
        isOnline: true,
        rating: 4.8
      },
      {
        id: '2',
        name: 'Jean Dupont',
        avatar: 'assets/avatars/coach2.jpg',
        specialties: ['Performance', 'Organisation'],
        isOnline: true,
        rating: 4.6
      },
      {
        id: '3',
        name: 'Marie Laurent',
        avatar: 'assets/avatars/coach3.jpg',
        specialties: ['Communication', 'Relations'],
        isOnline: false,
        rating: 4.9
      }
    ];
  }

  private createMockTicket(data: Partial<SupportTicket>): SupportTicket {
    return {
      id: this.generateId(),
      userId: data.userId || this.getCurrentUserId(),
      title: data.title || 'Nouveau ticket',
      description: data.description || '',
      status: 'open',
      priority: data.priority || 'medium',
      category: data.category || 'general',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
  }

  private createMockMessage(data: Partial<ChatMessage>): ChatMessage {
    return {
      id: this.generateId(),
      ticketId: data.ticketId,
      senderId: data.senderId || this.getCurrentUserId(),
      senderType: data.senderType || 'user',
      content: data.content || '',
      timestamp: new Date(),
      isRead: false,
      messageType: 'text'
    };
  }
}