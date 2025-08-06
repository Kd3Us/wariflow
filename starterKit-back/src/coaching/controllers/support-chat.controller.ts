import { Controller, Get, Post, Body, Param, Put, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SupportChatService } from '../service/support-chat.service';
import { CreateTicketDto, UpdateTicketDto, SendMessageDto } from '../dto/support-chat.dto';
import { TokenAuthGuard } from '../../common/guards/token-auth.guard';

@ApiTags('Support Chat')
@Controller('api/coaching/support')
@UseGuards(TokenAuthGuard)
@ApiBearerAuth()
export class SupportChatController {
  constructor(private readonly supportChatService: SupportChatService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Créer un nouveau ticket de support' })
  @ApiResponse({ status: 201, description: 'Ticket créé avec succès' })
  async createTicket(@Body() createTicketDto: CreateTicketDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || createTicketDto.userId;
    return await this.supportChatService.createTicket({
      ...createTicketDto,
      userId
    });
  }

  @Get('tickets/user/:userId')
  @ApiOperation({ summary: 'Récupérer les tickets d\'un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des tickets de l\'utilisateur' })
  async getUserTickets(@Param('userId') userId: string) {
    return await this.supportChatService.getUserTickets(userId);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Récupérer un ticket par ID' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 200, description: 'Détails du ticket' })
  async getTicket(@Param('id') ticketId: string) {
    return await this.supportChatService.getTicket(ticketId);
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Mettre à jour un ticket' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 200, description: 'Ticket mis à jour' })
  async updateTicket(@Param('id') ticketId: string, @Body() updateTicketDto: UpdateTicketDto) {
    return await this.supportChatService.updateTicket(ticketId, updateTicketDto);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  @ApiResponse({ status: 201, description: 'Message envoyé' })
  async sendMessage(@Body() sendMessageDto: SendMessageDto, @Request() req: any) {
    const senderId = sendMessageDto.senderId || req.user?.sub || req.user?.userId;
    return await this.supportChatService.addMessage(sendMessageDto.ticketId, {
      ...sendMessageDto,
      senderId
    });
  }

  @Get('tickets/:id/messages')
  @ApiOperation({ summary: 'Récupérer les messages d\'un ticket' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 200, description: 'Liste des messages' })
  async getMessages(@Param('id') ticketId: string) {
    return await this.supportChatService.getMessages(ticketId);
  }

  @Patch('messages/:id/read')
  @ApiOperation({ summary: 'Marquer un message comme lu' })
  @ApiParam({ name: 'id', description: 'ID du message' })
  @ApiResponse({ status: 200, description: 'Message marqué comme lu' })
  async markMessageAsRead(@Param('id') messageId: string) {
    await this.supportChatService.markMessageAsRead(messageId);
    return { success: true };
  }

  @Get('coaches/available')
  @ApiOperation({ summary: 'Récupérer les coaches disponibles pour le support' })
  @ApiResponse({ status: 200, description: 'Liste des coaches disponibles' })
  async getAvailableCoaches() {
    return await this.supportChatService.getAvailableCoaches();
  }

  @Patch('tickets/:id/assign')
  @ApiOperation({ summary: 'Assigner un coach à un ticket' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 200, description: 'Coach assigné au ticket' })
  async assignCoach(@Param('id') ticketId: string, @Body() data: { coachId?: string }) {
    return await this.supportChatService.assignCoach(ticketId, data.coachId);
  }

  @Patch('tickets/:id/close')
  @ApiOperation({ summary: 'Fermer un ticket' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 200, description: 'Ticket fermé' })
  async closeTicket(@Param('id') ticketId: string) {
    return await this.supportChatService.closeTicket(ticketId);
  }

  @Post('bot/response')
  @ApiOperation({ summary: 'Obtenir une réponse du bot' })
  @ApiResponse({ status: 200, description: 'Réponse du bot' })
  async getBotResponse(@Body() data: { message: string; category?: string }) {
    const response = await this.supportChatService.getBotResponse(data.message, data.category);
    return { response };
  }
}