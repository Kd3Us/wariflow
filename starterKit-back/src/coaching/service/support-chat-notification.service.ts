import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SenderType, MessageType } from '../dto/support-chat.dto';
import { ChatMessage, SupportTicket } from '../entities/support-ticket.entity';

@Injectable()
export class SupportChatNotificationService {
  constructor(
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
  ) {}

  async sendSystemNotification(
    ticketId: string,
    content: string,
    messageType: MessageType = 'system'
  ): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      ticketId,
      senderId: 'system',
      senderType: 'bot' as SenderType,
      content,
      timestamp: new Date(),
      isRead: false,
      messageType,
    });

    return await this.messageRepository.save(message);
  }

  async notifyTicketCreated(ticketId: string): Promise<void> {
    await this.sendSystemNotification(
      ticketId,
      'Votre ticket a été créé avec succès. Un coach va prendre en charge votre demande.'
    );
  }

  async notifyCoachAssigned(ticketId: string, coachName: string): Promise<void> {
    await this.sendSystemNotification(
      ticketId,
      `${coachName} a été assigné à votre ticket et va vous contacter.`
    );
  }

  async notifyTicketStatusChanged(ticketId: string, newStatus: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      'assigned': 'Votre ticket a été assigné à un coach.',
      'in_progress': 'Votre ticket est en cours de traitement.',
      'resolved': 'Votre ticket a été résolu.',
      'closed': 'Votre ticket a été fermé.'
    };

    const message = statusMessages[newStatus] || `Le statut de votre ticket a été mis à jour: ${newStatus}`;
    
    await this.sendSystemNotification(ticketId, message);
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    const tickets = await this.ticketRepository.find({
      where: { userId },
      relations: ['messages'],
    });

    let unreadCount = 0;
    for (const ticket of tickets) {
      unreadCount += ticket.messages.filter(m => 
        !m.isRead && m.senderType !== 'user'
      ).length;
    }

    return unreadCount;
  }

  async markMessagesAsRead(ticketId: string, userId: string): Promise<void> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, userId },
      relations: ['messages'],
    });

    if (ticket) {
      const messageIds = ticket.messages
        .filter(m => !m.isRead && m.senderType !== 'user')
        .map(m => m.id);

      if (messageIds.length > 0) {
        await this.messageRepository.update(
          messageIds,
          { isRead: true }
        );
      }
    }
  }

  async notifyNewMessage(
    ticketId: string,
    senderId: string,
    senderType: SenderType,
    content: string
  ): Promise<void> {
    console.log(`Notification: Nouveau message de ${senderType} ${senderId} sur le ticket ${ticketId}`);
    
    if (senderType === 'coach') {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });
      
      if (ticket) {
        console.log(`Notification envoyée à l'utilisateur ${ticket.userId}`);
      }
    }
  }
}