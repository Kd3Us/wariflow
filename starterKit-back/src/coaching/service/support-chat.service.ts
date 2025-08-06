import { Injectable } from '@nestjs/common';
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

    const botMessage = this.messageRepository.create({
      ticketId: savedTicket.id,
      senderId: 'bot',
      senderType: 'bot',
      content: 'Votre ticket a été créé. Un coach va vous contacter bientôt.',
      timestamp: new Date(),
      isRead: false,
      messageType: 'system',
    });

    await this.messageRepository.save(botMessage);

    return await this.getTicket(savedTicket.id);
  }

  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    return await this.ticketRepository.find({
      where: { userId },
      relations: ['messages'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getTicket(ticketId: string): Promise<SupportTicket> {
    return await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['messages'],
    });
  }

  async updateTicket(ticketId: string, updateTicketDto: UpdateTicketDto): Promise<SupportTicket> {
    await this.ticketRepository.update(ticketId, {
      ...updateTicketDto,
      updatedAt: new Date(),
    });

    return await this.getTicket(ticketId);
  }

  async addMessage(ticketId: string, sendMessageDto: SendMessageDto): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      ticketId,
      ...sendMessageDto,
      timestamp: new Date(),
    });

    const savedMessage = await this.messageRepository.save(message);

    await this.ticketRepository.update(ticketId, {
      updatedAt: new Date(),
    });

    return savedMessage;
  }

  async getAvailableCoaches(): Promise<Coach[]> {
    return await this.coachRepository.find({
      where: { isOnline: true },
      order: { name: 'ASC' },
    });
  }

  async assignCoach(ticketId: string, coachId?: string): Promise<SupportTicket> {
    let selectedCoach: Coach;

    if (coachId) {
      selectedCoach = await this.coachRepository.findOne({
        where: { id: coachId, isOnline: true },
      });
    } else {
      const availableCoaches = await this.getAvailableCoaches();
      if (availableCoaches.length > 0) {
        selectedCoach = availableCoaches[0];
      }
    }

    if (selectedCoach) {
      await this.ticketRepository.update(ticketId, {
        coachId: selectedCoach.id,
        status: 'assigned',
        updatedAt: new Date(),
      });

      const systemMessage = this.messageRepository.create({
        ticketId,
        senderId: 'system',
        senderType: 'bot',
        content: `${selectedCoach.name} a été assigné à votre ticket et va vous contacter.`,
        timestamp: new Date(),
        isRead: false,
        messageType: 'system',
      });

      await this.messageRepository.save(systemMessage);
    }

    return await this.getTicket(ticketId);
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