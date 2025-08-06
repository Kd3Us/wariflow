import { Injectable } from '@nestjs/common';
import { SupportChatService } from './support-chat.service';
import { ChatMessage } from '../entities/support-ticket.entity';
import { SenderType, MessageType } from '../dto/support-chat.dto';

@Injectable()
export class SupportChatNotificationService {
  private connectedUsers = new Map<string, any>();

  constructor(private readonly supportChatService: SupportChatService) {}

  async handleMessage(ticketId: string, messageData: any): Promise<ChatMessage> {
    const message = await this.supportChatService.addMessage(ticketId, messageData);

    if (messageData.senderType === 'user') {
      setTimeout(async () => {
        const botResponse = await this.supportChatService.getBotResponse(messageData.content);
        
        await this.supportChatService.addMessage(ticketId, {
          senderId: 'bot',
          senderType: SenderType.BOT,
          content: botResponse,
          messageType: MessageType.TEXT,
          isRead: false,
        });
      }, 1500);
    }

    return message;
  }

  async assignCoach(ticketId: string, userId: string, coachId?: string) {
    const updatedTicket = await this.supportChatService.assignCoach(ticketId, coachId);
    
    return {
      success: true,
      ticket: updatedTicket,
      coachId: updatedTicket.coachId,
    };
  }

  async getAvailableCoaches() {
    return await this.supportChatService.getAvailableCoaches();
  }

  async getUserTickets(userId: string) {
    return await this.supportChatService.getUserTickets(userId);
  }
}