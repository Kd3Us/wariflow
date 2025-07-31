import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SessionHistoryService } from '../service/session-history.service';
import { CreateDetailedFeedbackDto, CoachResponseDto } from '../dto/session-history.dto';

@ApiTags('Feedbacks')
@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly sessionHistoryService: SessionHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un feedback détaillé' })
  @ApiResponse({ status: 201, description: 'Feedback créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createFeedback(@Body() feedbackDto: CreateDetailedFeedbackDto) {
    return await this.sessionHistoryService.createDetailedFeedback(
      feedbackDto.sessionHistoryId,
      feedbackDto
    );
  }

  @Get('coach/:coachId')
  @ApiOperation({ summary: 'Récupérer tous les feedbacks d\'un coach' })
  @ApiParam({ name: 'coachId', description: 'ID du coach' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre maximum de feedbacks' })
  @ApiQuery({ name: 'onlyPublic', required: false, description: 'Seulement les feedbacks publics' })
  @ApiResponse({ status: 200, description: 'Liste des feedbacks' })
  async getCoachFeedbacks(
    @Param('coachId') coachId: string,
    @Query('limit') limit?: number,
    @Query('onlyPublic') onlyPublic?: boolean
  ) {
    return await this.sessionHistoryService.getCoachFeedbacks(coachId, {
      limit,
      onlyPublic
    });
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Récupérer tous les feedbacks d\'un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des feedbacks de l\'utilisateur' })
  async getUserFeedbacks(@Param('userId') userId: string) {
    return await this.sessionHistoryService.getUserFeedbacks(userId);
  }

  @Get('session/:sessionHistoryId')
  @ApiOperation({ summary: 'Récupérer le feedback d\'une session spécifique' })
  @ApiParam({ name: 'sessionHistoryId', description: 'ID de l\'historique de session' })
  @ApiResponse({ status: 200, description: 'Feedback de la session' })
  @ApiResponse({ status: 404, description: 'Feedback non trouvé' })
  async getSessionFeedback(@Param('sessionHistoryId') sessionHistoryId: string) {
    return await this.sessionHistoryService.getSessionFeedback(sessionHistoryId);
  }

  @Post(':feedbackId/coach-response')
  @ApiOperation({ summary: 'Ajouter une réponse de coach à un feedback' })
  @ApiParam({ name: 'feedbackId', description: 'ID du feedback' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Réponse ajoutée avec succès' })
  @ApiResponse({ status: 404, description: 'Feedback non trouvé' })
  async addCoachResponse(
    @Param('feedbackId') feedbackId: string,
    @Body() responseDto: CoachResponseDto
  ) {
    return await this.sessionHistoryService.addCoachResponse(feedbackId, responseDto.response);
  }

  @Put(':feedbackId/verify')
  @ApiOperation({ summary: 'Vérifier un feedback (admin)' })
  @ApiParam({ name: 'feedbackId', description: 'ID du feedback' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Feedback vérifié' })
  @ApiResponse({ status: 404, description: 'Feedback non trouvé' })
  async verifyFeedback(@Param('feedbackId') feedbackId: string) {
    return await this.sessionHistoryService.verifyFeedback(feedbackId);
  }

  @Put(':feedbackId/public')
  @ApiOperation({ summary: 'Rendre un feedback public/privé' })
  @ApiParam({ name: 'feedbackId', description: 'ID du feedback' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Visibilité du feedback mise à jour' })
  @ApiResponse({ status: 404, description: 'Feedback non trouvé' })
  async toggleFeedbackVisibility(
    @Param('feedbackId') feedbackId: string,
    @Body() data: { isPublic: boolean }
  ) {
    return await this.sessionHistoryService.toggleFeedbackVisibility(feedbackId, data.isPublic);
  }

  @Get('stats/coach/:coachId')
  @ApiOperation({ summary: 'Statistiques des feedbacks d\'un coach' })
  @ApiParam({ name: 'coachId', description: 'ID du coach' })
  @ApiResponse({ status: 200, description: 'Statistiques des feedbacks' })
  async getCoachFeedbackStats(@Param('coachId') coachId: string) {
    return await this.sessionHistoryService.getCoachFeedbackStats(coachId);
  }

  @Get('stats/global')
  @ApiOperation({ summary: 'Statistiques globales des feedbacks' })
  @ApiQuery({ name: 'period', required: false, description: 'Période (7d, 30d, 90d, 1y)' })
  @ApiResponse({ status: 200, description: 'Statistiques globales' })
  async getGlobalFeedbackStats(@Query('period') period: string = '30d') {
    return await this.sessionHistoryService.getGlobalFeedbackStats(period);
  }

  @Get('pending-responses')
  @ApiOperation({ summary: 'Feedbacks en attente de réponse coach' })
  @ApiQuery({ name: 'coachId', required: false, description: 'Filtrer par coach' })
  @ApiResponse({ status: 200, description: 'Feedbacks en attente' })
  async getPendingResponses(@Query('coachId') coachId?: string) {
    return await this.sessionHistoryService.getPendingCoachResponses(coachId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Feedbacks récents' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre de feedbacks' })
  @ApiQuery({ name: 'verified', required: false, description: 'Seulement les vérifiés' })
  @ApiResponse({ status: 200, description: 'Feedbacks récents' })
  async getRecentFeedbacks(
    @Query('limit') limit: number = 10,
    @Query('verified') verified?: boolean
  ) {
    return await this.sessionHistoryService.getRecentFeedbacks(limit, verified);
  }
}