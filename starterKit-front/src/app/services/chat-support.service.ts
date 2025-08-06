import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';

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

  private startPolling(): void {
    interval(5000).subscribe(() => {
      this.refreshData();
    });
  }

  private refreshData(): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      this.getUserTickets().subscribe(tickets => {
        this.ticketsSubject.next(tickets);
      });
      
      this.getAvailableCoaches().subscribe(coaches => {
        this.coachesSubject.next(coaches);
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
        this.coachesSubject.next([]);
        }
    });
    }

  createTicket(ticketData: Partial<SupportTicket>): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/tickets`, ticketData);
  }

  getUserTickets(): Observable<SupportTicket[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<SupportTicket[]>(`${this.apiUrl}/tickets/user/${userId}`);
  }

  getTicket(ticketId: string): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(`${this.apiUrl}/tickets/${ticketId}`);
  }

  updateTicket(ticketId: string, updateData: Partial<SupportTicket>): Observable<SupportTicket> {
    return this.http.put<SupportTicket>(`${this.apiUrl}/tickets/${ticketId}`, updateData);
  }

  sendMessage(ticketId: string, message: Partial<ChatMessage>): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/tickets/${ticketId}/messages`, message);
  }

  getAvailableCoaches(): Observable<Coach[]> {
    return this.http.get<Coach[]>(`${this.apiUrl}/coaches/available`);
  }

  assignCoach(ticketId: string, coachId?: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.apiUrl}/tickets/${ticketId}/assign-coach`, { coachId });
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
    return localStorage.getItem('userId') || 'guest-user';
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
}