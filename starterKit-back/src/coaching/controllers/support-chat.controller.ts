import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupportChatService } from '../service/support-chat.service';
import { CreateTicketDto, UpdateTicketDto, SendMessageDto } from '../dto/support-chat.dto';

@ApiTags('Support Chat')
@Controller('coaching/support')
export class SupportChatController {
  constructor(private readonly supportChatService: SupportChatService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Créer un nouveau ticket de support' })
  @ApiResponse({ status: 201, description: 'Ticket créé avec succès' })
  async createTicket(@Body() createTicketDto: CreateTicketDto) {
    return await this.supportChatService.createTicket(createTicketDto);
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

  @Put('tickets/:id')
  @ApiOperation({ summary: 'Mettre à jour un ticket' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 200, description: 'Ticket mis à jour' })
  async updateTicket(@Param('id') ticketId: string, @Body() updateTicketDto: UpdateTicketDto) {
    return await this.supportChatService.updateTicket(ticketId, updateTicketDto);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Ajouter un message à un ticket' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 201, description: 'Message ajouté' })
  async addMessage(@Param('id') ticketId: string, @Body() sendMessageDto: SendMessageDto) {
    return await this.supportChatService.addMessage(ticketId, sendMessageDto);
  }

  @Get('coaches/available')
  @ApiOperation({ summary: 'Récupérer les coaches disponibles pour le support' })
  @ApiResponse({ status: 200, description: 'Liste des coaches disponibles' })
  async getAvailableCoaches() {
    return await this.supportChatService.getAvailableCoaches();
  }

  @Post('tickets/:id/assign-coach')
  @ApiOperation({ summary: 'Assigner un coach à un ticket' })
  @ApiParam({ name: 'id', description: 'ID du ticket' })
  @ApiResponse({ status: 200, description: 'Coach assigné au ticket' })
  async assignCoach(@Param('id') ticketId: string, @Body() data: { coachId?: string }) {
    return await this.supportChatService.assignCoach(ticketId, data.coachId);
  }
}