import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CoachingService } from '../service/coaching.service';
import { SmartNotificationService } from '../service/smart-notification.service';

@ApiTags('Coaching')
@Controller('coaching')
export class CoachingController {
  constructor(
    private readonly coachingService: CoachingService,
    private readonly smartNotificationService: SmartNotificationService
  ) {}

  @Get('coaches')
  @ApiOperation({ summary: 'Récupérer tous les coaches' })
  @ApiQuery({ name: 'specialty', required: false, description: 'Filtrer par spécialité' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Note minimum' })
  @ApiQuery({ name: 'maxRate', required: false, description: 'Tarif maximum' })
  @ApiResponse({ status: 200, description: 'Liste des coaches' })
  async getAllCoaches(@Query() filters: any) {
    return await this.coachingService.findAllCoaches(filters);
  }

  @Get('coaches/search')
  @ApiOperation({ summary: 'Rechercher des coaches' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche' })
  @ApiResponse({ status: 200, description: 'Coaches correspondant à la recherche' })
  async searchCoaches(@Query('q') searchTerm: string) {
    return await this.coachingService.searchCoaches(searchTerm);
  }

  @Post('coaches/match')
  @ApiOperation({ summary: 'Trouver des coaches correspondant aux critères' })
  @ApiResponse({ status: 200, description: 'Coaches recommandés avec score de matching' })
  async matchCoaches(@Body() criteria: any) {
    return await this.coachingService.findMatchingCoaches(criteria);
  }

  @Get('coaches/:id')
  @ApiOperation({ summary: 'Récupérer un coach par ID' })
  @ApiParam({ name: 'id', description: 'ID du coach' })
  @ApiResponse({ status: 200, description: 'Détails du coach' })
  @ApiResponse({ status: 404, description: 'Coach non trouvé' })
  async getCoachById(@Param('id') id: string) {
    return await this.coachingService.findCoachById(id);
  }

  @Get('coaches/:id/availability')
  @ApiOperation({ summary: 'Récupérer les disponibilités d\'un coach' })
  @ApiParam({ name: 'id', description: 'ID du coach' })
  @ApiResponse({ status: 200, description: 'Disponibilités du coach' })
  async getCoachAvailability(@Param('id') coachId: string) {
    return await this.coachingService.getCoachAvailability(coachId);
  }

  @Get('coaches/:id/reviews')
  @ApiOperation({ summary: 'Récupérer les avis d\'un coach' })
  @ApiParam({ name: 'id', description: 'ID du coach' })
  @ApiResponse({ status: 200, description: 'Avis du coach' })
  async getCoachReviews(@Param('id') coachId: string) {
    return await this.coachingService.getCoachReviews(coachId);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Réserver une session' })
  @ApiResponse({ status: 201, description: 'Session réservée avec succès' })
  @ApiResponse({ status: 400, description: 'Erreur de réservation' })
  async bookSession(@Body() sessionData: any) {
    return await this.coachingService.bookSession(sessionData);
  }

  @Get('sessions/user/:userId')
  @ApiOperation({ summary: 'Récupérer les sessions d\'un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Sessions de l\'utilisateur' })
  async getUserSessions(@Param('userId') userId: string) {
    return await this.coachingService.getUserSessions(userId);
  }

  @Put('sessions/:id/complete')
  @ApiOperation({ summary: 'Marquer une session comme terminée' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Session marquée comme terminée' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async completeSession(@Param('id') sessionId: string, @Body() completionData: any) {
    return await this.coachingService.completeSession(sessionId, completionData);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Récupérer une session par ID' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Détails de la session' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async getSessionById(@Param('id') id: string) {
    return await this.coachingService.getSessionById(id);
  }

  @Put('sessions/:id')
  @ApiOperation({ summary: 'Mettre à jour une session' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Session mise à jour' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async updateSession(@Param('id') id: string, @Body() updateData: any) {
    return await this.coachingService.updateSession(id, updateData);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Annuler une session' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Session annulée' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async cancelSession(@Param('id') id: string) {
    return await this.coachingService.cancelSession(id);
  }

  @Post('reviews')
  @ApiOperation({ summary: 'Créer un avis' })
  @ApiResponse({ status: 201, description: 'Avis créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createReview(@Body() reviewData: any) {
    return await this.coachingService.createReview(reviewData);
  }

  @Get('dashboard/:userId')
  @ApiOperation({ summary: 'Récupérer les statistiques du dashboard utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Statistiques du dashboard' })
  async getDashboardStats(@Param('userId') userId: string) {
    return await this.coachingService.getDashboardStats(userId);
  }

  @Post('reminders/:sessionId')
  @ApiOperation({ summary: 'Envoyer un rappel de session' })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Rappel envoyé' })
  async sendReminder(@Param('sessionId') sessionId: string, @Body() data: { type: string }) {
    return await this.coachingService.sendSessionReminder(sessionId, data.type);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Récupérer l\'historique détaillé des sessions' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'coachId', required: false, description: 'Filtrer par coach' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Date de début' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Date de fin' })
  @ApiResponse({ status: 200, description: 'Historique détaillé des sessions' })
  async getSessionHistory(@Param('userId') userId: string, @Query() filters: any) {
    return await this.coachingService.getSessionHistory(userId, filters);
  }

  @Post('history/:sessionId/feedback')
  @ApiOperation({ summary: 'Ajouter un feedback détaillé à une session' })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Feedback ajouté avec succès' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async addDetailedFeedback(@Param('sessionId') sessionId: string, @Body() feedbackData: any) {
    return await this.coachingService.addSessionFeedback(sessionId, feedbackData);
  }

  @Post('history/:sessionHistoryId/detailed-feedback')
  @ApiOperation({ summary: 'Créer un feedback multicritères' })
  @ApiParam({ name: 'sessionHistoryId', description: 'ID de l\'historique de session' })
  @ApiResponse({ status: 201, description: 'Feedback détaillé créé' })
  async createDetailedFeedback(@Param('sessionHistoryId') sessionHistoryId: string, @Body() feedbackData: any) {
    return await this.coachingService.createDetailedFeedback(sessionHistoryId, feedbackData);
  }

  @Post('history/:sessionHistoryId/documents')
  @ApiOperation({ summary: 'Uploader un document de session' })
  @ApiParam({ name: 'sessionHistoryId', description: 'ID de l\'historique de session' })
  @ApiResponse({ status: 201, description: 'Document uploadé' })
  async uploadSessionDocument(@Param('sessionHistoryId') sessionHistoryId: string, @Body() documentData: any) {
    return await this.coachingService.uploadSessionDocument(sessionHistoryId, documentData);
  }

  @Post('history/:sessionHistoryId/progress')
  @ApiOperation({ summary: 'Enregistrer la progression d\'une session' })
  @ApiParam({ name: 'sessionHistoryId', description: 'ID de l\'historique de session' })
  @ApiResponse({ status: 201, description: 'Progression enregistrée' })
  async trackProgress(@Param('sessionHistoryId') sessionHistoryId: string, @Body() progressData: any) {
    return await this.coachingService.trackSessionProgress(sessionHistoryId, progressData);
  }

  @Get('reports/:userId')
  @ApiOperation({ summary: 'Générer un rapport de coaching' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Date de début du rapport' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Date de fin du rapport' })
  @ApiResponse({ status: 200, description: 'Rapport généré' })
  async generateReport(@Param('userId') userId: string, @Query() filters: any) {
    return await this.coachingService.generateSessionReport(userId, filters);
  }

  @Get('export/:userId')
  @ApiOperation({ summary: 'Exporter l\'historique de coaching' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'format', enum: ['json', 'csv'], description: 'Format d\'export' })
  @ApiResponse({ status: 200, description: 'Données exportées' })
  async exportHistory(@Param('userId') userId: string, @Query('format') format: 'json' | 'csv' = 'json') {
    return await this.coachingService.exportSessionHistory(userId, format);
  }

  // ==================== NOUVELLES ROUTES NOTIFICATIONS ====================

  @Post('sessions/:sessionId/notifications/schedule')
  @ApiOperation({ summary: 'Programmer les notifications pour une session' })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  @ApiResponse({ status: 201, description: 'Notifications programmées' })
  async scheduleNotifications(@Param('sessionId') sessionId: string, @Body() sessionData: any) {
    await this.smartNotificationService.scheduleSessionNotifications({
      sessionId,
      ...sessionData
    });
    
    return {
      success: true,
      message: 'Notifications programmées avec succès'
    };
  }

  @Delete('sessions/:sessionId/notifications')
  @ApiOperation({ summary: 'Annuler les notifications d\'une session' })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Notifications annulées' })
  async cancelNotifications(@Param('sessionId') sessionId: string) {
    await this.smartNotificationService.cancelSessionNotifications(sessionId);
    
    return {
      success: true,
      message: 'Notifications annulées'
    };
  }

  @Put('sessions/:sessionId/notifications/reschedule')
  @ApiOperation({ summary: 'Reprogrammer les notifications d\'une session' })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Notifications reprogrammées' })
  async rescheduleNotifications(@Param('sessionId') sessionId: string, @Body() newSessionData: any) {
    await this.smartNotificationService.rescheduleSessionNotifications(sessionId, {
      sessionId,
      ...newSessionData
    });
    
    return {
      success: true,
      message: 'Notifications reprogrammées'
    };
  }

  @Get('users/:userId/notification-preferences')
  @ApiOperation({ summary: 'Récupérer les préférences de notification' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Préférences récupérées' })
  async getNotificationPreferences(@Param('userId') userId: string) {
    const preferences = await this.smartNotificationService.getUserPreferences(userId);
    
    return {
      success: true,
      data: preferences
    };
  }

  @Put('users/:userId/notification-preferences')
  @ApiOperation({ summary: 'Mettre à jour les préférences de notification' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour' })
  async updateNotificationPreferences(@Param('userId') userId: string, @Body() preferences: any) {
    const updated = await this.smartNotificationService.updateUserPreferences(userId, preferences);
    
    return {
      success: true,
      data: updated,
      message: 'Préférences mises à jour'
    };
  }
}