import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;

  private destroy$ = new Subject<void>();

  messageForm!: FormGroup;
  ticketForm!: FormGroup;
  
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
  isSubmitting = false;
  
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
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.messageForm = this.fb.group({
      message: ['', [Validators.required, this.customMessageValidator]]
    });

    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      priority: ['medium', Validators.required]
    });
  }

  private customMessageValidator(control: any) {
    const value = control.value;
    if (!value || typeof value !== 'string') {
      return { required: true };
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return { required: true };
    }
    return null;
  }

  ngOnInit(): void {
    console.log('ChatSupportComponent initialized');
    console.log('Initial form state:', {
      valid: this.messageForm.valid,
      value: this.messageForm.value,
      errors: this.messageForm.errors
    });
    
    this.initializeWebSocketConnection();
    this.setupFormSubscriptions();
    this.loadAvailableCoaches();
    this.loadUserTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.websocketService.disconnect();
  }

  checkFormState(): void {
    console.log('=== FORM DEBUG ===');
    console.log('messageForm valid:', this.messageForm.valid);
    console.log('messageForm value:', this.messageForm.value);
    console.log('messageForm errors:', this.messageForm.errors);
    console.log('message control:', this.messageForm.get('message'));
    console.log('message control value:', this.messageForm.get('message')?.value);
    console.log('message control errors:', this.messageForm.get('message')?.errors);
    console.log('message control valid:', this.messageForm.get('message')?.valid);
    console.log('==================');
  }

  testSendMessage(): void {
    console.log('Test send message...');
    this.messageForm.get('message')?.setValue('Test message');
    this.checkFormState();
    this.sendMessage();
  }

  forceValidateForm(): void {
    this.messageForm.markAllAsTouched();
    this.messageForm.updateValueAndValidity();
    this.checkFormState();
  }

  onMessageInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.messageForm.get('message')?.setValue(target.value);
    this.messageForm.get('message')?.updateValueAndValidity();
  }

  onMessageFocus(): void {
    console.log('Message input focused, checking form state...');
    this.checkFormState();
  }

  private initializeWebSocketConnection(): void {
    console.log('Initializing WebSocket connection...');
    
    this.websocketService.connect();

    this.websocketService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        console.log('Connection status changed:', status);
        this.connectionStatus = status;
        this.isConnected = status.connected;
        this.cdr.detectChanges();
      });

    this.websocketService.getMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        console.log('Messages received via WebSocket:', messages);
        this.messages = messages;
        this.updateUnreadCount();
        setTimeout(() => this.scrollToBottom(), 100);
        this.cdr.detectChanges();
      });

    this.websocketService.getTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tickets => {
        console.log('Tickets received via WebSocket:', tickets);
        this.tickets = tickets;
        this.cdr.detectChanges();
      });

    this.websocketService.getOnlineCoaches()
      .pipe(takeUntil(this.destroy$))
      .subscribe(coaches => {
        console.log('Online coaches received:', coaches);
        this.onlineCoaches = coaches;
        this.coaches = coaches;
        this.cdr.detectChanges();
      });

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
    console.log('Loading available coaches via HTTP...');
    
    this.chatService.getAvailableCoaches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coaches) => {
          console.log('Coaches loaded via HTTP:', coaches);
          this.coaches = coaches;
          if (this.onlineCoaches.length === 0) {
            this.onlineCoaches = coaches.filter(coach => coach.isOnline);
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading coaches:', error);
        }
      });
  }

  private loadUserTickets(): void {
    console.log('Loading user tickets...');
    
    this.chatService.getUserTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tickets) => {
          console.log('User tickets loaded:', tickets);
          this.tickets = tickets;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading user tickets:', error);
        }
      });
  }

  private loadTicketMessages(ticketId: string): void {
    console.log('Loading messages for ticket:', ticketId);
    
    if (this.currentTicket && this.currentTicket.messages && this.currentTicket.messages.length > 0) {
      this.messages = this.currentTicket.messages;
      this.cdr.detectChanges();
      setTimeout(() => this.scrollToBottom(), 100);
      return;
    }

    this.chatService.getTicketMessages(ticketId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages: ChatMessage[]) => {
          console.log('Messages loaded for ticket:', ticketId, messages);
          this.messages = messages;
          this.cdr.detectChanges();
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error: any) => {
          console.error('Error loading ticket messages:', error);
          this.messages = [];
          this.cdr.detectChanges();
        }
      });
  }

  async createTicket(): Promise<void> {
    if (!this.ticketForm.valid) return;

    try {
      const formValue = this.ticketForm.value;
      const ticketData = {
        userId: this.getCurrentUserId(),
        title: formValue.title as string,
        description: formValue.description as string,
        category: formValue.category as string,
        priority: formValue.priority as 'low' | 'medium' | 'high' | 'urgent'
      };

      if (this.isConnected) {
        const ticket = await this.websocketService.createTicket(ticketData);
        this.showTicketForm = false;
        this.ticketForm.reset();
        this.selectTicket(ticket);
      } else {
        this.createTicketFallback();
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la création du ticket:', error);
      this.createTicketFallback();
    }
  }

  private createTicketFallback(): void {
    const formValue = this.ticketForm.value;
    const ticketData = {
      userId: this.getCurrentUserId(),
      title: formValue.title as string,
      description: formValue.description as string,
      category: formValue.category as string,
      priority: formValue.priority as 'low' | 'medium' | 'high' | 'urgent',
      status: 'open' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };

    this.chatService.createTicket(ticketData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ticket => {
        const welcomeMessage: ChatMessage = {
          id: this.generateId(),
          ticketId: ticket.id,
          senderId: 'bot',
          senderType: 'bot',
          content: `Votre ticket "${ticket.title}" a été créé avec succès. Comment puis-je vous aider ?`,
          timestamp: new Date(),
          isRead: false,
          messageType: 'text'
        };
        
        ticket.messages = [welcomeMessage];
        this.tickets.unshift(ticket);
        this.selectTicket(ticket);
        this.showTicketForm = false;
        this.ticketForm.reset();
        this.cdr.detectChanges();
      });
  }

  async sendMessage(): Promise<void> {
    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('Form valid:', this.messageForm.valid);
    console.log('Form value:', this.messageForm.value);
    
    if (this.isSubmitting) {
      console.log('Already submitting, returning...');
      return;
    }

    if (!this.messageForm.valid) {
      console.log('Form is invalid, stopping');
      console.log('Form errors:', this.messageForm.errors);
      console.log('Message control errors:', this.messageForm.get('message')?.errors);
      this.forceValidateForm();
      return;
    }

    const content = this.messageForm.get('message')?.value?.trim();
    console.log('Message content:', content);
    
    if (!content) {
      console.log('No content after trim, stopping');
      return;
    }

    this.isSubmitting = true;
    console.log('Current ticket:', this.currentTicket);

    try {
      if (!this.currentTicket) {
        console.log('Aucun ticket sélectionné, création automatique...');
        await this.createAutoTicket(content);
        return;
      }

      if (this.isConnected) {
        this.websocketService.setTypingStatus(this.currentTicket.id, false);
      }

      this.messageForm.get('message')?.setValue('');
      this.messageForm.get('message')?.markAsPristine();

      if (this.isConnected) {
        console.log('Sending via WebSocket...');
        await this.websocketService.sendMessage(this.currentTicket.id, content);
      } else {
        console.log('Sending via HTTP fallback...');
        this.chatService.sendMessage(this.currentTicket.id, content)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (message) => {
              console.log('Message sent via HTTP:', message);
              this.messages.push(message);
              this.cdr.detectChanges();
              setTimeout(() => this.scrollToBottom(), 100);
            },
            error: (error) => {
              console.error('Error sending message via HTTP:', error);
              this.messageForm.get('message')?.setValue(content);
            }
          });
      }

      this.cdr.detectChanges();
      setTimeout(() => this.scrollToBottom(), 100);

    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      this.messageForm.get('message')?.setValue(content);
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }

    console.log('=== END SEND MESSAGE DEBUG ===');
  }

  private async createAutoTicket(firstMessage: string): Promise<void> {
    const ticketData = {
      title: `Conversation - ${new Date().toLocaleTimeString()}`,
      description: firstMessage.substring(0, 100),
      category: 'Support technique',
      priority: 'medium' as const
    };

    try {
      if (this.isConnected) {
        const ticket = await this.websocketService.createTicket(ticketData);
        this.selectTicket(ticket);
        await this.websocketService.sendMessage(ticket.id, firstMessage);
      } else {
        this.chatService.createTicket({
          ...ticketData,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: []
        }).pipe(takeUntil(this.destroy$))
        .subscribe(ticket => {
          this.tickets.unshift(ticket);
          this.selectTicket(ticket);
          this.chatService.sendMessage(ticket.id, firstMessage)
            .pipe(takeUntil(this.destroy$))
            .subscribe();
        });
      }
    } catch (error) {
      console.error('Erreur création auto ticket:', error);
    } finally {
      this.isSubmitting = false;
      this.messageForm.get('message')?.setValue('');
      this.cdr.detectChanges();
    }
  }

  async requestHumanCoach(): Promise<void> {
    if (!this.currentTicket) return;

    try {
      if (this.isConnected) {
        await this.websocketService.requestHumanCoach(this.currentTicket.id);
      } else {
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
        this.messages.push(systemMessage);
        this.cdr.detectChanges();
        this.scrollToBottom();
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
        this.messages.push(noCoachMessage);
        this.showTicketForm = true;
        this.cdr.detectChanges();
        this.scrollToBottom();
      }, 1000);
    }
  }

  async assignSpecificCoach(coach: Coach): Promise<void> {
    if (!this.currentTicket) {
      try {
        const ticketData = {
          userId: this.getCurrentUserId(),
          title: `Contact avec ${coach.name}`,
          description: `Demande de coaching avec ${coach.name}`,
          category: 'Coaching' as string,
          priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
        };

        if (this.isConnected) {
          const ticket = await this.websocketService.createTicket(ticketData);
          this.selectTicket(ticket);
          await this.websocketService.assignCoach(ticket.id, coach.id);
        } else {
          const fullTicketData = {
            ...ticketData,
            status: 'open' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: []
          };
          
          this.chatService.createTicket(fullTicketData)
            .pipe(takeUntil(this.destroy$))
            .subscribe(ticket => {
              this.tickets.unshift(ticket);
              this.selectTicket(ticket);
              this.assignedCoach = coach;
              this.cdr.detectChanges();
            });
        }
      } catch (error: any) {
        console.error('Erreur lors de la création du ticket pour le coach:', error);
      }
      return;
    }

    if (!this.isConnected) return;

    try {
      await this.websocketService.assignCoach(this.currentTicket.id, coach.id);
      this.assignedCoach = coach;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Erreur lors de l\'assignation du coach:', error);
    }
  }

  selectTicket(ticket: SupportTicket): void {
    console.log('=== SELECTING TICKET ===');
    console.log('Ticket reçu:', ticket);
    
    this.currentTicket = ticket;
    this.currentView = 'chat'; 
    
    console.log('currentTicket assigné:', this.currentTicket);
    console.log('Vue changée vers:', this.currentView);
    
    this.assignedCoach = (ticket as any).coach || null;
    
    this.messages = ticket.messages || [];
    if (this.messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: this.generateId(),
        ticketId: ticket.id,
        senderId: 'bot',
        senderType: 'bot',
        content: `Bonjour ! Votre ticket "${ticket.title}" a été créé. Comment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date(),
        isRead: false,
        messageType: 'text'
      };
      this.messages = [welcomeMessage];
    }
    
    this.cdr.detectChanges();
    setTimeout(() => this.scrollToBottom(), 100);
    
    console.log('=== TICKET SELECTED - SHOULD SHOW CHAT ===');
  }

  selectBotOption(option: string): void {
    if (option === 'Parler à un coach humain') {
      this.requestHumanCoach();
    } else {
      this.handleBotResponse(option);
    }
  }

  private handleBotResponse(option: string): void {
    if (!this.currentTicket) {
      const ticketData = {
        userId: this.getCurrentUserId(),
        title: option,
        description: `Demande d'aide pour: ${option}`,
        category: 'Support technique' as string,
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
      };

      if (this.isConnected) {
        this.websocketService.createTicket(ticketData)
          .then(ticket => {
            this.selectTicket(ticket);
            this.addBotResponse(option);
          })
          .catch((error: any) => {
            console.error('Erreur création ticket bot:', error);
          });
      } else {
        const fullTicketData = {
          ...ticketData,
          status: 'open' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: []
        };
        
        this.chatService.createTicket(fullTicketData)
          .pipe(takeUntil(this.destroy$))
          .subscribe(ticket => {
            this.tickets.unshift(ticket);
            this.selectTicket(ticket);
            this.addBotResponse(option);
          });
      }
    } else {
      this.addBotResponse(option);
    }
  }

  private addBotResponse(option: string): void {
    setTimeout(() => {
      const botResponse = this.chatService.simulateBotResponse(option);
      this.messages.push(botResponse);
      this.cdr.detectChanges();
      this.scrollToBottom();
    }, 1000);
  }

  async closeCurrentTicket(): Promise<void> {
    if (!this.currentTicket) return;

    try {
      if (this.isConnected) {
        await this.websocketService.closeTicket(this.currentTicket.id);
      }
      this.currentTicket = null;
      this.messages = [];
      this.assignedCoach = null;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Erreur lors de la fermeture du ticket:', error);
    }
  }

  reconnectWebSocket(): void {
    this.websocketService.reconnect();
  }

  refreshData(): void {
    console.log('Refreshing all data...');
    this.loadAvailableCoaches();
    this.loadUserTickets();
    if (this.isConnected) {
      this.websocketService.requestOnlineCoaches();
    }
  }

  debugState(): void {
    console.log('=== CHAT SUPPORT DEBUG STATE ===');
    console.log('isConnected:', this.isConnected);
    console.log('currentView:', this.currentView);
    console.log('currentTicket:', this.currentTicket);
    console.log('tickets:', this.tickets);
    console.log('messages:', this.messages);
    console.log('coaches:', this.coaches);
    console.log('onlineCoaches:', this.onlineCoaches);
    console.log('assignedCoach:', this.assignedCoach);
    console.log('messageForm valid:', this.messageForm.valid);
    console.log('messageForm value:', this.messageForm.value);
    console.log('isSubmitting:', this.isSubmitting);
    console.log('================================');
  }

  trackTicket(index: number, ticket: SupportTicket): string {
    return ticket.id;
  }

  trackCoach(index: number, coach: Coach): string {
    return coach.id;
  }

  trackMessage(index: number, message: ChatMessage): string {
    return message.id;
  }

  hasSelectedTicket(): boolean {
    const result = !!(this.currentTicket && this.currentTicket.id);
    console.log('hasSelectedTicket():', result, this.currentTicket?.id);
    return result;
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
    console.log('Key pressed:', event.key, 'Form valid:', this.messageForm.valid);
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      console.log('Enter pressed, attempting to send message...');
      this.sendMessage();
    }
  }

  toggleTicketForm(): void {
    this.showTicketForm = !this.showTicketForm;
  }
}