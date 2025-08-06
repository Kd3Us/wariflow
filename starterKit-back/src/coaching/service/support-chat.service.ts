import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, ChatMessage } from '../entities/support-ticket.entity';
import { Coach } from '../entities/coach.entity';
import { CreateTicketDto, UpdateTicketDto, SendMessageDto } from '../dto/support-chat.dto';

@Injectable()
export class SupportChatService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    @InjectRepository(Coach)
    private coachRepository: Repository<Coach>,
  ) {}

  async createTicket(createTicketDto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    if (createTicketDto.initialMessage) {
      const message = this.messageRepository.create({
        ticketId: savedTicket.id,
        senderId: createTicketDto.userId,
        senderType: 'user',
        content: createTicketDto.initialMessage,
        timestamp: new Date(),
        isRead: false,
        messageType: 'text',
      });
      await this.messageRepository.save(message);
    }

    const botMessage = this.messageRepository.create({
      ticketId: savedTicket.id,
      senderId: 'bot',
      senderType: 'bot',
      content: 'Bonjour! Un coach va prendre en charge votre demande dans quelques instants.',
      timestamp: new Date(),
      isRead: false,
      messageType: 'system',
    });
    await this.messageRepository.save(botMessage);

    return this.getTicket(savedTicket.id);
  }

  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    return await this.ticketRepository.find({
      where: { userId },
      relations: ['messages', 'coach'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getTicket(ticketId: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['messages', 'coach'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} non trouvé`);
    }

    return ticket;
  }

  async updateTicket(ticketId: string, updateTicketDto: UpdateTicketDto): Promise<SupportTicket> {
    await this.ticketRepository.update(ticketId, {
      ...updateTicketDto,
      updatedAt: new Date(),
    });

    return this.getTicket(ticketId);
  }

  async addMessage(ticketId: string, sendMessageDto: SendMessageDto): Promise<ChatMessage> {
    const ticket = await this.getTicket(ticketId);

    const message = this.messageRepository.create({
      ticketId,
      senderId: sendMessageDto.senderId,
      senderType: sendMessageDto.senderType || 'user',
      content: sendMessageDto.content,
      timestamp: new Date(),
      isRead: false,
      messageType: sendMessageDto.messageType || 'text',
    });

    const savedMessage = await this.messageRepository.save(message);

    await this.ticketRepository.update(ticketId, {
      updatedAt: new Date(),
    });

    if (sendMessageDto.senderType === 'user' && ticket.status === 'open') {
      await this.ticketRepository.update(ticketId, {
        status: 'assigned',
      });
    }

    return savedMessage;
  }

  async getMessages(ticketId: string): Promise<ChatMessage[]> {
    return await this.messageRepository.find({
      where: { ticketId },
      order: { timestamp: 'ASC' },
    });
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, {
      isRead: true,
    });
  }

  async getAvailableCoaches(): Promise<Coach[]> {
    return await this.coachRepository.find({
      select: ['id', 'name', 'email', 'specialties'],
    });
  }

  async assignCoach(ticketId: string, coachId?: string): Promise<SupportTicket> {
    let selectedCoachId = coachId;

    if (!selectedCoachId) {
      const availableCoaches = await this.getAvailableCoaches();
      if (availableCoaches.length > 0) {
        selectedCoachId = availableCoaches[0].id;
      }
    }

    if (selectedCoachId) {
      await this.ticketRepository.update(ticketId, {
        coachId: selectedCoachId,
        status: 'assigned',
        updatedAt: new Date(),
      });

      const systemMessage = this.messageRepository.create({
        ticketId,
        senderId: 'system',
        senderType: 'bot',
        content: `Un coach a été assigné à votre ticket et va vous contacter.`,
        timestamp: new Date(),
        isRead: false,
        messageType: 'system',
      });

      await this.messageRepository.save(systemMessage);
    }

    return this.getTicket(ticketId);
  }

  async closeTicket(ticketId: string): Promise<SupportTicket> {
    await this.ticketRepository.update(ticketId, {
      status: 'closed',
      updatedAt: new Date(),
    });

    const systemMessage = this.messageRepository.create({
      ticketId,
      senderId: 'system',
      senderType: 'bot',
      content: 'Ce ticket a été fermé. Merci de nous avoir contactés.',
      timestamp: new Date(),
      isRead: false,
      messageType: 'system',
    });

    await this.messageRepository.save(systemMessage);

    return this.getTicket(ticketId);
  }

  async getBotResponse(message: string, category?: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('problème') || lowerMessage.includes('bug') || lowerMessage.includes('erreur')) {
      return 'Je comprends que vous rencontrez un problème technique. Pouvez-vous me donner plus de détails sur ce qui ne fonctionne pas ?';
    }

    if (lowerMessage.includes('coaching') || lowerMessage.includes('formation')) {
      return 'Pour vos questions sur le coaching, je peux vous mettre en relation avec un de nos coaches spécialisés. Souhaitez-vous que je vous trouve un coach disponible ?';
    }

    if (lowerMessage.includes('facture') || lowerMessage.includes('paiement') || lowerMessage.includes('prix')) {
      return 'Pour toute question concernant la facturation, notre équipe financière peut vous aider. Je crée un ticket prioritaire pour vous.';
    }

    if (lowerMessage.includes('coach') || lowerMessage.includes('humain') || lowerMessage.includes('personne')) {
      return 'Je vous mets en relation avec un coach humain. Veuillez patienter quelques instants...';
    }

    return 'Je vais transférer votre demande à un coach humain qui pourra mieux vous aider. Un instant s\'il vous plaît...';
  }
}