import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ChatSupportService, ChatMessage, SupportTicket, Coach } from '../../../services/chat-support.service';

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
  assignedCoach: Coach | null = null;
  
  isConnected = true;
  unreadCount = 0;
  showTicketForm = false;
  currentView: 'chat' | 'tickets' = 'chat';
  
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
    private chatService: ChatSupportService
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
    this.loadUserTickets();
    this.loadAvailableCoaches();
    this.startBotConversation();
    this.subscribeToUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToUpdates(): void {
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
        setTimeout(() => this.scrollToBottom(), 100);
      });

    this.chatService.tickets$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tickets => {
        this.tickets = tickets;
        if (tickets.length > 0 && !this.currentTicket) {
          this.selectTicket(tickets[0]);
        }
      });

    this.chatService.coaches$
      .pipe(takeUntil(this.destroy$))
      .subscribe(coaches => {
        this.coaches = coaches;
      });
  }

  private loadUserTickets(): void {
    this.chatService.getUserTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tickets => {
        this.tickets = tickets;
      });
  }

  private loadAvailableCoaches(): void {
    this.chatService.getAvailableCoaches()
      .pipe(takeUntil(this.destroy$))
      .subscribe(coaches => {
        this.coaches = coaches;
      });
  }

  private startBotConversation(): void {
    const botMessage: ChatMessage = {
      id: this.generateId(),
      senderId: 'bot',
      senderType: 'bot',
      content: 'Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(),
      isRead: false,
      messageType: 'text'
    };

    setTimeout(() => {
      this.chatService.addMessage(botMessage);
      this.showBotOptions();
    }, 1000);
  }

  private showBotOptions(): void {
    const optionsMessage: ChatMessage = {
      id: this.generateId(),
      senderId: 'bot',
      senderType: 'bot',
      content: 'options',
      timestamp: new Date(),
      isRead: false,
      messageType: 'text'
    };

    setTimeout(() => {
      this.chatService.addMessage(optionsMessage);
    }, 500);
  }

  selectBotOption(option: string): void {
    const userMessage: ChatMessage = {
      id: this.generateId(),
      senderId: this.getCurrentUserId(),
      senderType: 'user',
      content: option,
      timestamp: new Date(),
      isRead: true,
      messageType: 'text'
    };

    this.chatService.addMessage(userMessage);

    if (option === 'Parler à un coach humain') {
      this.requestHumanCoach();
    } else {
      this.handleBotResponse(option);
    }
  }

  private requestHumanCoach(): void {
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

  private handleBotResponse(option: string): void {
    setTimeout(() => {
      const botResponse = this.chatService.simulateBotResponse(option);
      this.chatService.addMessage(botResponse);
    }, 1000);
  }

  sendMessage(): void {
    if (this.messageForm.valid) {
      const content = this.messageForm.get('message')?.value.trim();
      if (!content) return;

      const message: ChatMessage = {
        id: this.generateId(),
        ticketId: this.currentTicket?.id,
        senderId: this.getCurrentUserId(),
        senderType: 'user',
        content: content,
        timestamp: new Date(),
        isRead: true,
        messageType: 'text'
      };

      this.chatService.addMessage(message);

      if (this.currentTicket) {
        this.chatService.sendMessage(this.currentTicket.id, message)
          .pipe(takeUntil(this.destroy$))
          .subscribe(response => {
            console.log('Message envoyé:', response);
          });
      }

      setTimeout(() => {
        const botResponse = this.chatService.simulateBotResponse(content);
        this.chatService.addMessage(botResponse);
      }, 1500);

      this.messageForm.reset();
    }
  }

  createTicket(): void {
    if (this.ticketForm.valid) {
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
  }

  selectTicket(ticket: SupportTicket): void {
    this.currentTicket = ticket;
    this.chatService.setMessages(ticket.messages || []);
    
    this.assignedCoach = ticket.coachId 
      ? this.coaches.find(coach => coach.id === ticket.coachId) || null
      : null;
  }

  setView(view: 'chat' | 'tickets'): void {
    this.currentView = view;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('userId') || 'guest-user';
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
}