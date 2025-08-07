import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as socketIo from 'socket.io-client';
import { JwtService } from './jwt.service';
import { ChatMessage, SupportTicket, Coach } from './chat-support.service';

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
}

export interface TypingUser {
  userId: string;
  userType: 'user' | 'coach';
  ticketId: string;
  isTyping: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: any = null;
  
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>({
    connected: false,
    reconnecting: false
  });
  
  private messages$ = new BehaviorSubject<ChatMessage[]>([]);
  private tickets$ = new BehaviorSubject<SupportTicket[]>([]);
  private onlineCoaches$ = new BehaviorSubject<Coach[]>([]);
  private typingUsers$ = new BehaviorSubject<TypingUser[]>([]);
  
  private currentMessages: ChatMessage[] = [];
  private currentTickets: SupportTicket[] = [];
  private typingTimeout: { [key: string]: any } = {};

  constructor(private jwtService: JwtService) {}

  connect() {
    const token = this.jwtService.getToken();
    if (!token) {
      console.warn('No JWT token available for WebSocket connection');
      this.connectionStatus$.next({
        connected: false,
        reconnecting: false,
        error: 'No token available'
      });
      return;
    }

    console.log('Attempting WebSocket connection to localhost:3009');
    
    this.socket = socketIo.connect('http://localhost:3009', {
      forceNew: true,
      auth: {
        token: token.startsWith('Bearer ') ? token : `Bearer ${token}`
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this.connectionStatus$.next({ connected: true, reconnecting: false });
      this.socket.emit('join_support_chat');
      this.requestOnlineCoaches();
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      this.connectionStatus$.next({ 
        connected: false, 
        reconnecting: false,
        error: `Connection error: ${error.message || 'Unknown error'}`
      });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.connectionStatus$.next({ 
        connected: false, 
        reconnecting: reason === 'io server disconnect' ? false : true,
        error: reason
      });
    });

    this.socket.on('reconnecting', (attemptNumber: number) => {
      console.log(`WebSocket reconnecting attempt ${attemptNumber}`);
      this.connectionStatus$.next({ connected: false, reconnecting: true });
    });

    this.socket.on('reconnect', () => {
      console.log('WebSocket reconnected');
      this.connectionStatus$.next({ connected: true, reconnecting: false });
      this.socket.emit('join_support_chat');
      this.requestOnlineCoaches();
    });

    this.socket.on('connection_success', (data: any) => {
      console.log('Connection success:', data);
    });

    this.socket.on('user_tickets', (data: any) => {
      console.log('User tickets received:', data);
      if (data.tickets) {
        this.currentTickets = data.tickets;
        this.tickets$.next([...this.currentTickets]);
      }
    });

    this.socket.on('new_message', (data: any) => {
      console.log('New message received:', data);
      if (data.message) {
        this.handleNewMessage(data.message);
      }
    });

    this.socket.on('ticket_created', (data: any) => {
      console.log('Ticket created:', data);
      if (data.ticket) {
        this.addTicket(data.ticket);
      }
    });

    this.socket.on('ticket_assigned', (ticket: SupportTicket) => {
      console.log('Ticket assigned:', ticket);
      this.updateTicket(ticket);
    });

    this.socket.on('coach_assigned', (data: any) => {
      console.log('Coach assigned:', data);
      this.updateTicketCoach(data.ticketId, data.coach);
    });

    this.socket.on('coach_status_changed', (data: any) => {
      console.log('Coach status changed:', data);
      this.updateCoachStatus(data.coachId, data.isOnline);
    });

    this.socket.on('online_coaches', (coaches: Coach[]) => {
      console.log('Online coaches updated:', coaches);
      this.onlineCoaches$.next(coaches);
    });

    this.socket.on('typing_start', (data: TypingUser) => {
      this.handleTypingIndicator({ ...data, isTyping: true });
    });

    this.socket.on('typing_stop', (data: TypingUser) => {
      this.handleTypingIndicator({ ...data, isTyping: false });
    });

    this.socket.on('user_typing', (data: TypingUser) => {
      this.handleTypingIndicator(data);
    });

    this.socket.on('messages_read', (data: any) => {
      this.markTicketMessagesAsRead(data.ticketId, data.readBy);
    });

    this.socket.on('ticket_closed', (data: any) => {
      console.log('Ticket closed:', data);
      this.updateTicketStatus(data.ticketId, 'closed');
    });

    this.socket.on('new_ticket_available', (data: any) => {
      console.log('New ticket available for coaches:', data);
    });

    this.socket.on('new_ticket_created', (data: any) => {
      console.log('New ticket created globally:', data);
    });

    this.socket.on('urgent_ticket_assigned', (data: any) => {
      console.log('Urgent ticket assigned:', data);
      this.updateTicket(data.ticket);
    });

    this.socket.on('new_ticket_assignment', (data: any) => {
      console.log('New ticket assignment:', data);
      if (data.ticket) {
        this.updateTicket(data.ticket);
      }
    });

    this.socket.on('no_coach_available', (data: any) => {
      console.log('No coach available:', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.connectionStatus$.next({
        connected: this.socket?.connected || false,
        reconnecting: false,
        error: error.message || 'Server error'
      });
    });
  }

  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }

  getMessages(): Observable<ChatMessage[]> {
    return this.messages$.asObservable();
  }

  getTickets(): Observable<SupportTicket[]> {
    return this.tickets$.asObservable();
  }

  getOnlineCoaches(): Observable<Coach[]> {
    return this.onlineCoaches$.asObservable();
  }

  getTypingUsers(): Observable<TypingUser[]> {
    return this.typingUsers$.asObservable();
  }

  createTicket(ticketData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('create_ticket', ticketData, (response: any) => {
        if (response?.success) {
          resolve(response.ticket);
        } else {
          reject(new Error(response?.error || 'Failed to create ticket'));
        }
      });
    });
  }

  sendMessage(ticketId: string, content: string, messageType: string = 'text'): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('send_message', { ticketId, content, messageType }, (response: any) => {
        if (response?.success) {
          resolve(response.message);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }

  assignCoach(ticketId: string, coachId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('assign_coach', { ticketId, coachId }, (response: any) => {
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to assign coach'));
        }
      });
    });
  }

  requestHumanCoach(ticketId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('request_human_coach', { ticketId }, (response: any) => {
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || response?.message || 'Failed to request coach'));
        }
      });
    });
  }

  markMessagesRead(ticketId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('mark_messages_read', { ticketId }, (response: any) => {
        if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to mark messages as read'));
        }
      });
    });
  }

  setTypingStatus(ticketId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;

    if (isTyping) {
      this.socket.emit('typing_start', { ticketId });
      
      if (this.typingTimeout[ticketId]) {
        clearTimeout(this.typingTimeout[ticketId]);
      }
      
      this.typingTimeout[ticketId] = setTimeout(() => {
        this.setTypingStatus(ticketId, false);
      }, 3000);
    } else {
      this.socket.emit('typing_stop', { ticketId });
    }
  }

  closeTicket(ticketId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('close_ticket', { ticketId }, (response: any) => {
        if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to close ticket'));
        }
      });
    });
  }

  requestOnlineCoaches(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('get_online_coaches');
  }

  private handleNewMessage(message: ChatMessage) {
    this.currentMessages.push(message);
    this.messages$.next([...this.currentMessages]);
  }

  private addTicket(ticket: SupportTicket) {
    this.currentTickets.push(ticket);
    this.tickets$.next([...this.currentTickets]);
  }

  private updateTicket(updatedTicket: SupportTicket) {
    const index = this.currentTickets.findIndex(t => t.id === updatedTicket.id);
    if (index !== -1) {
      this.currentTickets[index] = updatedTicket;
    } else {
      this.currentTickets.push(updatedTicket);
    }
    this.tickets$.next([...this.currentTickets]);
  }

  private updateTicketCoach(ticketId: string, coach: any) {
    const ticket = this.currentTickets.find(t => t.id === ticketId);
    if (ticket) {
      (ticket as any).coach = coach;
      ticket.coachId = coach.id;
      this.tickets$.next([...this.currentTickets]);
    }
  }

  private updateCoachStatus(coachId: string, isOnline: boolean) {
    const currentCoaches = this.onlineCoaches$.value;
    if (isOnline) {
      this.requestOnlineCoaches();
    } else {
      const filteredCoaches = currentCoaches.filter(coach => coach.id !== coachId);
      this.onlineCoaches$.next(filteredCoaches);
    }
  }

  private handleTypingIndicator(data: TypingUser) {
    const currentTyping = this.typingUsers$.value;
    const existingIndex = currentTyping.findIndex(
      u => u.userId === data.userId && u.ticketId === data.ticketId
    );

    if (data.isTyping) {
      if (existingIndex === -1) {
        currentTyping.push(data);
      }
    } else {
      if (existingIndex !== -1) {
        currentTyping.splice(existingIndex, 1);
      }
    }

    this.typingUsers$.next([...currentTyping]);
  }

  private markTicketMessagesAsRead(ticketId: string, userId: string) {
    this.currentMessages = this.currentMessages.map(msg => {
      if (msg.ticketId === ticketId && msg.senderId !== userId) {
        return { ...msg, isRead: true };
      }
      return msg;
    });
    this.messages$.next([...this.currentMessages]);
  }

  private updateTicketStatus(ticketId: string, status: string) {
    const ticket = this.currentTickets.find(t => t.id === ticketId);
    if (ticket) {
      (ticket as any).status = status;
      this.tickets$.next([...this.currentTickets]);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    Object.values(this.typingTimeout).forEach(timeout => clearTimeout(timeout));
    this.typingTimeout = {};
    
    this.connectionStatus$.next({ connected: false, reconnecting: false });
  }

  reconnect() {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}