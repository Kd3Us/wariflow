import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionHistoryService } from '../service/session-history.service';
import { 
  CreateSessionHistoryDto, 
  UpdateSessionHistoryDto, 
  AddFeedbackDto,
  CreateDetailedFeedbackDto,
  SessionHistoryFilterDto,
  UploadDocumentDto,
  TrackProgressDto,
  CoachResponseDto 
} from '../dto/session-history.dto';

@ApiTags('Session History & Feedbacks')
@Controller('session-history')
export class SessionHistoryController {
  constructor(private readonly sessionHistoryService: SessionHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel historique de session' })
  @ApiResponse({ status: 201, description: 'Historique de session créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createSessionHistory(@Body() createDto: CreateSessionHistoryDto) {
    return await this.sessionHistoryService.createSessionHistory({
      sessionId: createDto.sessionId,
      coachId: createDto.coachId,
      userId: createDto.userId,
      coachName: createDto.coachName,
      date: new Date(createDto.date),
      duration: createDto.duration,
      topic: createDto.topic,
      notes: createDto.notes
    });
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Récupérer l\'historique des sessions d\'un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'coachId', required: false, description: 'Filtrer par coach' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Date de début (ISO)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Date de fin (ISO)' })
  @ApiQuery({ name: 'topics', required: false, description: 'Sujets (séparés par virgule)' })
  @ApiQuery({ name: 'tags', required: false, description: 'Tags (séparés par virgule)' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Note minimum' })
  @ApiQuery({ name: 'status', required: false, description: 'Statut de la session' })
  @ApiResponse({ status: 200, description: 'Liste des sessions de l\'utilisateur' })
  async getUserSessionHistory(
    @Param('userId') userId: string,
    @Query() filters: SessionHistoryFilterDto
  ) {
    return await this.sessionHistoryService.getUserSessionHistory(userId, filters);
  }

  @Get('dashboard/:userId')
  @ApiOperation({ summary: 'Récupérer les statistiques du tableau de bord' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Statistiques du tableau de bord' })
  async getDashboardStats(@Param('userId') userId: string) {
    return await this.sessionHistoryService.getDashboardStats(userId);
  }

  @Get('report/:userId')
  @ApiOperation({ summary: 'Générer un rapport de sessions' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Date de début du rapport' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Date de fin du rapport' })
  @ApiResponse({ status: 200, description: 'Rapport de sessions généré' })
  async generateReport(
    @Param('userId') userId: string,
    @Query() filters: SessionHistoryFilterDto
  ) {
    return await this.sessionHistoryService.generateSessionReport(userId, filters);
  }

  @Get('export/:userId')
  @ApiOperation({ summary: 'Exporter l\'historique des sessions' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'format', enum: ['json', 'csv'], description: 'Format d\'export' })
  @ApiResponse({ status: 200, description: 'Données exportées' })
  async exportHistory(
    @Param('userId') userId: string,
    @Query('format') format: 'json' | 'csv' = 'json'
  ) {
    return await this.sessionHistoryService.exportHistory(userId, format);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une session par ID' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Détails de la session' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async getSessionById(@Param('id') id: string) {
    return await this.sessionHistoryService.getSessionById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour l\'historique d\'une session' })
  @ApiParam({ name: 'id', description: 'ID de la session' })
  @ApiResponse({ status: 200, description: 'Session mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async updateSessionHistory(
    @Param('id') id: string,
    @Body() updateDto: UpdateSessionHistoryDto
  ) {
    return await this.sessionHistoryService.updateSessionHistory(id, updateDto);
  }

  @Post('feedback/:sessionId')
  @ApiOperation({ summary: 'Ajouter un feedback à une session' })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Feedback ajouté avec succès' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async addFeedback(
    @Param('sessionId') sessionId: string,
    @Body() feedbackDto: AddFeedbackDto
  ) {
    return await this.sessionHistoryService.addFeedback(sessionId, feedbackDto);
  }

  @Post('detailed-feedback')
  @ApiOperation({ summary: 'Créer un feedback détaillé' })
  @ApiResponse({ status: 201, description: 'Feedback détaillé créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createDetailedFeedback(@Body() feedbackDto: CreateDetailedFeedbackDto) {
    return await this.sessionHistoryService.createDetailedFeedback(
      feedbackDto.sessionHistoryId,
      feedbackDto
    );
  }

  @Post('feedback/:feedbackId/coach-response')
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

  @Post(':sessionHistoryId/documents')
  @ApiOperation({ summary: 'Uploader un document pour une session' })
  @ApiParam({ name: 'sessionHistoryId', description: 'ID de l\'historique de session' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'Document uploadé avec succès' })
  @ApiResponse({ status: 400, description: 'Erreur d\'upload' })
  async uploadDocument(
    @Param('sessionHistoryId') sessionHistoryId: string,
    @Body() documentDto: UploadDocumentDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (file) {
      documentDto.originalName = file.originalname;
      documentDto.mimeType = file.mimetype;
      documentDto.size = file.size;
    }
    
    return await this.sessionHistoryService.uploadSessionDocument(sessionHistoryId, documentDto);
  }

  @Get(':sessionHistoryId/documents')
  @ApiOperation({ summary: 'Récupérer les documents d\'une session' })
  @ApiParam({ name: 'sessionHistoryId', description: 'ID de l\'historique de session' })
  @ApiResponse({ status: 200, description: 'Liste des documents' })
  async getSessionDocuments(@Param('sessionHistoryId') sessionHistoryId: string) {
    return await this.sessionHistoryService.getSessionDocuments(sessionHistoryId);
  }

  @Post(':sessionHistoryId/progress')
  @ApiOperation({ summary: 'Enregistrer la progression d\'une session' })
  @ApiParam({ name: 'sessionHistoryId', description: 'ID de l\'historique de session' })
  @ApiResponse({ status: 201, description: 'Progression enregistrée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async trackProgress(
    @Param('sessionHistoryId') sessionHistoryId: string,
    @Body() progressDto: TrackProgressDto
  ) {
    const progressData = {
      ...progressDto,
      nextMilestoneDate: progressDto.nextMilestoneDate ? new Date(progressDto.nextMilestoneDate) : undefined
    };
    
    return await this.sessionHistoryService.trackProgress(sessionHistoryId, progressData);
  }

  @Get('progress/:userId')
  @ApiOperation({ summary: 'Récupérer la progression d\'un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Données de progression' })
  async getUserProgress(@Param('userId') userId: string) {
    return await this.sessionHistoryService.getUserProgress(userId);
  }
}