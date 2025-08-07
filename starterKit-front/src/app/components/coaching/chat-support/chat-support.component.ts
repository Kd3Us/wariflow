import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ChatSupportService, ChatMessage, SupportTicket, Coach } from '../../../services/chat-support.service';
import { WebSocketService, ConnectionStatus, TypingUser } from '../../../services/websocket.service';

@Component({
  selector: 'app-chat-support',
  templateUrl: './chat-support.component.html',
  styleUrls: ['./chat-support.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ChatSupportComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private destroy$ = new Subject<void>();

  messageForm: FormGroup;
  ticketForm: FormGroup;
  
  currentTicket: SupportTicket | null = null;
  tickets: SupportTicket[] = [];
  messages: ChatMessage[] = [];
  coaches: Coach[] = [];
  onlineCoaches: Coach[] = [];
  assignedCoach: Coach | null = null;
  
  connectionStatus: ConnectionStatus = { connected: false, reconnecting: false };
  isConnected = false;
  unreadCount = 0;
  showTicketForm = false;
  currentView: 'chat' | 'tickets' = 'chat';
  isTyping = false;
  typingUsers: TypingUser[] = [];
  
  categories = [
    'Support technique',
    'Coaching',
    'Facturation',
    'Fonctionnalités',
    'Autre'
  ];

  botResponses = [
    'Problème technique',
    'Question sur le coaching', 
    'Facturation',
    'Parler à un coach humain'
  ];

  constructor(
    private fb: FormBuilder,
    private chatService: ChatSupportService,
    private websocketService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) {
    this.messageForm = this.fb.group({
      message: ['', [Validators.required]]
    });

    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      priority: ['medium', Validators.required]
    });
  }

  ngOnInit(): void {
    this.initializeWebSocketConnection();
    this.setupFormSubscriptions();
    this.loadAvailableCoaches();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.websocketService.disconnect();
  }

  private initializeWebSocketConnection(): void {
    // Connexion WebSocket
    this.websocketService.connect();

    // Écouter le statut de connexion
    this.websocketService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.connectionStatus = status;
        this.isConnected = status.connected;
        this.cdr.detectChanges();
      });

    // Écouter les messages
    this.websocketService.getMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
        this.updateUnreadCount();
        setTimeout(() => this.scrollToBottom(), 100);
        this.cdr.detectChanges();
      });

    // Écouter les tickets
    this.websocketService.getTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tickets => {
        this.tickets = tickets;
        if (tickets.length > 0 && !this.currentTicket) {
          this.selectTicket(tickets[0]);
        }
        this.cdr.detectChanges();
      });

    // Écouter les coaches en ligne
    this.websocketService.getOnlineCoaches()
      .pipe(takeUntil(this.destroy$))
      .subscribe(coaches => {
        this.onlineCoaches = coaches;
        this.cdr.detectChanges();
      });

    // Écouter les indicateurs de frappe
    this.websocketService.getTypingUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(typingUsers => {
        this.typingUsers = typingUsers.filter(user => 
          this.currentTicket && user.ticketId === this.currentTicket.id
        );
        this.cdr.detectChanges();
      });
  }

  private setupFormSubscriptions(): void {
    // Indicateur de frappe
    this.messageForm.get('message')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (this.currentTicket && this.isConnected) {
          const isTyping = value && value.trim().length > 0;
          this.websocketService.setTypingStatus(this.currentTicket.id, isTyping);
        }
      });
  }

  private loadAvailableCoaches(): void {
    this.chatService.getAvailableCoaches()
      .pipe(takeUntil(this.destroy$))
      .subscribe(coaches => {
        this.coaches = coaches;
      });
  }

  async createTicket(): Promise<void> {
    if (!this.ticketForm.valid || !this.isConnected) return;

    try {
      const ticketData = {
        userId: this.getCurrentUserId(),
        ...this.ticketForm.value
      };

      const ticket = await this.websocketService.createTicket(ticketData);
      
      this.showTicketForm = false;
      this.ticketForm.reset();
      this.selectTicket(ticket);
      
    } catch (error: any) {
      console.error('Erreur lors de la création du ticket:', error);
      // Fallback vers HTTP si WebSocket échoue
      this.createTicketFallback();
    }
  }

  private createTicketFallback(): void {
    const ticketData = {
      userId: this.getCurrentUserId(),
      ...this.ticketForm.value,
      status: 'open' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };

    this.chatService.createTicket(ticketData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ticket => {
        this.chatService.updateTicketInList(ticket);
        this.selectTicket(ticket);
        this.showTicketForm = false;
        this.ticketForm.reset();
      });
  }

  async sendMessage(): Promise<void> {
    if (!this.messageForm.valid || !this.currentTicket) return;

    const content = this.messageForm.get('message')?.value?.trim();
    if (!content) return;

    try {
      // Arrêter l'indicateur de frappe
      if (this.isConnected) {
        this.websocketService.setTypingStatus(this.currentTicket.id, false);
      }

      this.messageForm.get('message')?.setValue('');

      if (this.isConnected) {
        // Utiliser WebSocket
        await this.websocketService.sendMessage(this.currentTicket.id, content);
      } else {
        // Fallback HTTP
        const message: ChatMessage = {
          id: this.generateId(),
          ticketId: this.currentTicket.id,
          senderId: this.getCurrentUserId(),
          senderType: 'user',
          content: content,
          timestamp: new Date(),
          isRead: true,
          messageType: 'text'
        };

        this.chatService.addMessage(message);
        this.chatService.sendMessage(this.currentTicket.id, message)
          .pipe(takeUntil(this.destroy$))
          .subscribe();
      }
      
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      // Remettre le message dans le champ en cas d'erreur
      this.messageForm.get('message')?.setValue(content);
    }
  }

  async requestHumanCoach(): Promise<void> {
    if (!this.currentTicket) return;

    try {
      if (this.isConnected) {
        await this.websocketService.requestHumanCoach(this.currentTicket.id);
      } else {
        // Fallback HTTP
        this.requestHumanCoachFallback();
      }
    } catch (error: any) {
      console.error('Erreur lors de la demande de coach:', error);
      this.requestHumanCoachFallback();
    }
  }

  private requestHumanCoachFallback(): void {
    const availableCoach = this.coaches.find(coach => coach.isOnline);
    
    if (availableCoach) {
      this.assignedCoach = availableCoach;
      
      const systemMessage: ChatMessage = {
        id: this.generateId(),
        senderId: 'system',
        senderType: 'bot',
        content: `Vous êtes maintenant en contact avec ${availableCoach.name}`,
        timestamp: new Date(),
        isRead: false,
        messageType: 'system'
      };

      setTimeout(() => {
        this.chatService.addMessage(systemMessage);
      }, 1500);
    } else {
      const noCoachMessage: ChatMessage = {
        id: this.generateId(),
        senderId: 'bot',
        senderType: 'bot',
        content: 'Aucun coach disponible. Vous pouvez créer un ticket.',
        timestamp: new Date(),
        isRead: false,
        messageType: 'text'
      };

      setTimeout(() => {
        this.chatService.addMessage(noCoachMessage);
        this.showTicketForm = true;
      }, 1000);
    }
  }

  async assignSpecificCoach(coach: Coach): Promise<void> {
    if (!this.currentTicket || !this.isConnected) return;

    try {
      await this.websocketService.assignCoach(this.currentTicket.id, coach.id);
    } catch (error: any) {
      console.error('Erreur lors de l\'assignation du coach:', error);
    }
  }

  selectTicket(ticket: SupportTicket): void {
    this.currentTicket = ticket;
    this.assignedCoach = (ticket as any).coach || null;
    this.messages = ticket.messages || [];
    
    // MODIFICATION : Vérifier la connexion avant de marquer comme lu
    if (this.isConnected) {
      this.websocketService.markMessagesRead(ticket.id).catch(error => {
        console.warn('Could not mark messages as read:', error);
      });
    }
    
    this.updateUnreadCount();
    setTimeout(() => this.scrollToBottom(), 100);
  }

  selectBotOption(option: string): void {
    if (option === 'Parler à un coach humain') {
      this.requestHumanCoach();
    } else {
      this.handleBotResponse(option);
    }
  }

  private handleBotResponse(option: string): void {
    setTimeout(() => {
      const botResponse = this.chatService.simulateBotResponse(option);
      this.chatService.addMessage(botResponse);
    }, 1000);
  }

  async closeCurrentTicket(): Promise<void> {
    if (!this.currentTicket || !this.isConnected) return;

    try {
      await this.websocketService.closeTicket(this.currentTicket.id);
      this.currentTicket = null;
    } catch (error: any) {
      console.error('Erreur lors de la fermeture du ticket:', error);
    }
  }

  reconnectWebSocket(): void {
    this.websocketService.reconnect();
  }

  private updateUnreadCount(): void {
    if (!this.currentTicket) {
      this.unreadCount = 0;
      return;
    }

    this.unreadCount = this.messages.filter(msg => 
      !msg.isRead && 
      msg.senderId !== this.getCurrentUserId()
    ).length;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('userId') || 'guest-user';
  }

  setView(view: 'chat' | 'tickets'): void {
    this.currentView = view;
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getTicketStatusColor(status: string): string {
    const colors = {
      'open': 'bg-blue-100 text-blue-800',
      'assigned': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  isUserTyping(ticketId: string): boolean {
    return this.typingUsers.some(user => 
      user.ticketId === ticketId && 
      user.isTyping && 
      user.userId !== this.getCurrentUserId()
    );
  }

  getTypingUsersText(ticketId: string): string {
    const typing = this.typingUsers.filter(user => 
      user.ticketId === ticketId && 
      user.isTyping && 
      user.userId !== this.getCurrentUserId()
    );

    if (typing.length === 0) return '';
    if (typing.length === 1) {
      const userType = typing[0].userType === 'coach' ? 'Le coach' : 'L\'utilisateur';
      return `${userType} est en train d'écrire...`;
    }
    return 'Plusieurs personnes écrivent...';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleTicketForm(): void {
    this.showTicketForm = !this.showTicketForm;
  }
}