import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { SupportChatService } from '../service/support-chat.service';
import { SupportChatNotificationService } from '../service/support-chat-notification.service';
import { SendMessageDto, CreateTicketDto } from '../dto/support-chat.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'user' | 'coach' | 'admin';
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'https://your-domain.com'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})
export class SupportChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportChatGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private userRooms = new Map<string, Set<string>>();
  private coachAvailability = new Map<string, boolean>();

  constructor(
    private readonly supportChatService: SupportChatService,
    private readonly notificationService: SupportChatNotificationService
  ) {}

  afterInit(server: Server) {
    this.logger.log('Support Chat WebSocket Gateway initialized on default namespace');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`Client attempting to connect: ${client.id}`);
      
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (!token) {
        this.logger.warn('Client disconnected: No authentication token');
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const decodedToken = this.extractUserFromToken(token);
      if (!decodedToken) {
        this.logger.warn('Client disconnected: Invalid token');
        client.emit('error', { message: 'Invalid authentication token' });
        client.disconnect();
        return;
      }

      client.userId = decodedToken.sub;
      client.userType = decodedToken.role || 'user';

      this.connectedUsers.set(client.userId, client);
      
      if (client.userType === 'coach') {
        this.coachAvailability.set(client.userId, true);
        this.server.emit('coach_status_changed', {
          coachId: client.userId,
          isOnline: true
        });
      }

      this.logger.log(`User ${client.userId} (${client.userType}) connected successfully`);

      client.emit('connection_success', {
        userId: client.userId,
        userType: client.userType
      });

      this.broadcastOnlineCoaches();

    } catch (error) {
      this.logger.error('Error during connection:', error);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`User ${client.userId} disconnected`);
      
      this.connectedUsers.delete(client.userId);

      if (client.userType === 'coach') {
        this.coachAvailability.delete(client.userId);
        this.server.emit('coach_status_changed', {
          coachId: client.userId,
          isOnline: false
        });
      }

      const userRooms = this.userRooms.get(client.userId);
      if (userRooms) {
        userRooms.forEach(room => {
          client.leave(room);
        });
        this.userRooms.delete(client.userId);
      }

      this.broadcastOnlineCoaches();
    }
  }

  @SubscribeMessage('join_support_chat')
  async handleJoinSupportChat(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      this.logger.log(`User ${client.userId} joined support chat`);
      
      const userTickets = await this.supportChatService.getUserTickets(client.userId);
      
      userTickets.forEach(ticket => {
        const roomName = `ticket_${ticket.id}`;
        client.join(roomName);
        
        if (!this.userRooms.has(client.userId)) {
          this.userRooms.set(client.userId, new Set());
        }
        this.userRooms.get(client.userId).add(roomName);
      });

      client.emit('user_tickets', { tickets: userTickets });
      this.broadcastOnlineCoaches();

    } catch (error) {
      this.logger.error('Error joining support chat:', error);
      client.emit('error', { message: 'Failed to join support chat' });
    }
  }

  @SubscribeMessage('create_ticket')
  @UsePipes(new ValidationPipe())
  async handleCreateTicket(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createTicketDto: CreateTicketDto
  ) {
    try {
      const ticketData = {
        ...createTicketDto,
        userId: client.userId,
        status: 'open'
      };

      const ticket = await this.supportChatService.createTicket(ticketData);
      
      const roomName = `ticket_${ticket.id}`;
      client.join(roomName);

      if (!this.userRooms.has(client.userId)) {
        this.userRooms.set(client.userId, new Set());
      }
      this.userRooms.get(client.userId).add(roomName);

      client.emit('ticket_created', { ticket });

      this.server.emit('new_ticket_created', {
        ticket,
        userType: client.userType
      });

      const availableCoaches = await this.supportChatService.getAvailableCoaches();
      availableCoaches.forEach(coach => {
        const coachSocket = this.connectedUsers.get(coach.id);
        if (coachSocket) {
          coachSocket.emit('new_ticket_available', {
            ticket,
            category: ticket.category,
            priority: ticket.priority
          });
        }
      });

      return { success: true, ticket };

    } catch (error) {
      this.logger.error('Error creating ticket:', error);
      client.emit('error', { message: 'Erreur lors de la création du ticket' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('send_message')
  @UsePipes(new ValidationPipe())
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string; content: string; messageType?: string }
  ) {
    try {
      const messageData: SendMessageDto = {
        ticketId: data.ticketId,
        senderId: client.userId,
        senderType: client.userType === 'coach' ? 'coach' : 'user',
        content: data.content,
        messageType: data.messageType || 'text',
        isRead: false
      };

      const message = await this.supportChatService.addMessage(data.ticketId, messageData);

      this.server.to(`ticket_${data.ticketId}`).emit('new_message', {
        ticketId: data.ticketId,
        message
      });

      await this.updateTicketActivity(data.ticketId);

      return { success: true, message };

    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('assign_coach')
  async handleAssignCoach(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string; coachId?: string }
  ) {
    try {
      const result = await this.supportChatService.assignCoach(data.ticketId, data.coachId);

      if (result.coachId) {
        const coachSocket = this.connectedUsers.get(result.coachId);
        if (coachSocket) {
          coachSocket.join(`ticket_${data.ticketId}`);
          
          if (!this.userRooms.has(result.coachId)) {
            this.userRooms.set(result.coachId, new Set());
          }
          this.userRooms.get(result.coachId).add(`ticket_${data.ticketId}`);
          
          coachSocket.emit('ticket_assigned', result);
        }

        this.server.to(`ticket_${data.ticketId}`).emit('coach_assigned', {
          ticketId: data.ticketId,
          coach: result.coach
        });
      }

      return { success: true, ticket: result, coachId: result.coachId };

    } catch (error) {
      this.logger.error('Error assigning coach:', error);
      client.emit('error', { message: 'Erreur lors de l\'assignation du coach' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('request_human_coach')
  async handleRequestHumanCoach(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string }
  ) {
    try {
      const availableCoaches = await this.supportChatService.getAvailableCoaches();
      
      if (availableCoaches.length === 0) {
        client.emit('no_coach_available', {
          ticketId: data.ticketId,
          message: 'Aucun coach disponible actuellement'
        });
        return { success: false, message: 'Aucun coach disponible' };
      }

      const assignResult = await this.supportChatService.assignCoach(data.ticketId);

      if (assignResult.coachId) {
        const coachSocket = this.connectedUsers.get(assignResult.coachId);
        if (coachSocket) {
          coachSocket.join(`ticket_${data.ticketId}`);
          
          if (!this.userRooms.has(assignResult.coachId)) {
            this.userRooms.set(assignResult.coachId, new Set());
          }
          this.userRooms.get(assignResult.coachId).add(`ticket_${data.ticketId}`);
          
          coachSocket.emit('new_ticket_assignment', {
            ticket: assignResult,
            message: 'Nouveau ticket assigné'
          });

          coachSocket.emit('urgent_ticket_assigned', {
            ticket: assignResult,
            requestType: 'human_coach_requested'
          });
        }

        client.emit('coach_assigned', {
          ticketId: data.ticketId,
          coach: assignResult.coach
        });
      }

      return { success: true, ticket: assignResult, coachId: assignResult.coachId };

    } catch (error) {
      this.logger.error('Error requesting human coach:', error);
      client.emit('error', { message: 'Erreur lors de la demande de coach' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('mark_messages_read')
  async handleMarkMessagesRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string }
  ) {
    try {
      const messages = await this.supportChatService.getMessages(data.ticketId);
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== client.userId);
      
      for (const message of unreadMessages) {
        await this.supportChatService.markMessageAsRead(message.id);
      }
      
      this.server.to(`ticket_${data.ticketId}`).emit('messages_read', {
        ticketId: data.ticketId,
        readBy: client.userId
      });

      return { success: true };

    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string }
  ) {
    client.to(`ticket_${data.ticketId}`).emit('typing_start', {
      userId: client.userId,
      userType: client.userType,
      ticketId: data.ticketId,
      isTyping: true
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string }
  ) {
    client.to(`ticket_${data.ticketId}`).emit('typing_stop', {
      userId: client.userId,
      userType: client.userType,
      ticketId: data.ticketId,
      isTyping: false
    });
  }

  @SubscribeMessage('coach_typing')
  async handleCoachTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string; isTyping: boolean }
  ) {
    client.to(`ticket_${data.ticketId}`).emit('user_typing', {
      ticketId: data.ticketId,
      userId: client.userId,
      userType: client.userType,
      isTyping: data.isTyping
    });
  }

  @SubscribeMessage('get_online_coaches')
  async handleGetOnlineCoaches(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      const onlineCoaches = await this.getOnlineCoachesData();
      client.emit('online_coaches', onlineCoaches);
      return { success: true, coaches: onlineCoaches };

    } catch (error) {
      this.logger.error('Error getting online coaches:', error);
      client.emit('error', { message: 'Erreur lors de la récupération des coaches' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('close_ticket')
  async handleCloseTicket(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string }
  ) {
    try {
      const ticket = await this.supportChatService.closeTicket(data.ticketId);

      this.server.to(`ticket_${data.ticketId}`).emit('ticket_closed', {
        ticketId: data.ticketId,
        ticket,
        closedBy: client.userId
      });

      return { success: true, ticket };

    } catch (error) {
      this.logger.error('Error closing ticket:', error);
      client.emit('error', { message: 'Erreur lors de la fermeture du ticket' });
      return { success: false, error: error.message };
    }
  }

  private extractUserFromToken(token: string): any {
    try {
      const cleanToken = token.replace('Bearer ', '');
      const payload = Buffer.from(cleanToken.split('.')[1], 'base64').toString();
      return JSON.parse(payload);
    } catch (error) {
      this.logger.error('Token decode error:', error);
      return null;
    }
  }

  private async broadcastOnlineCoaches() {
    try {
      const onlineCoaches = await this.getOnlineCoachesData();
      this.server.emit('online_coaches', onlineCoaches);
    } catch (error) {
      this.logger.error('Error broadcasting online coaches:', error);
    }
  }

  private async getOnlineCoachesData() {
    const onlineCoachIds = Array.from(this.coachAvailability.keys());
    if (onlineCoachIds.length === 0) {
      return [];
    }
    
    const coaches = await this.supportChatService.getAvailableCoaches();
    return coaches.filter(coach => onlineCoachIds.includes(coach.id));
  }

  private cleanupUserRooms(userId: string) {
    const rooms = this.userRooms.get(userId);
    if (rooms) {
      rooms.forEach(room => {
        this.server.to(room).emit('user_left', { userId });
      });
      this.userRooms.delete(userId);
    }
  }

  private async updateTicketActivity(ticketId: string) {
    try {
      await this.supportChatService.updateTicket(ticketId, {
        updatedAt: new Date()
      });
    } catch (error) {
      this.logger.error('Error updating ticket activity:', error);
    }
  }

  async broadcastToCoaches(event: string, data: any) {
    this.connectedUsers.forEach((socket, userId) => {
      if (socket.userType === 'coach') {
        socket.emit(event, data);
      }
    });
  }

  async sendToUser(userId: string, event: string, data: any) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
      return true;
    }
    return false;
  }
}