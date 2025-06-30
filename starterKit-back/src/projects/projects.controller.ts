import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddUsersToProjectDto } from './dto/add-users-to-project.dto';
import { FilterProjectsDto } from './dto/filter-projects.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { Project } from './entities/project.entity';
import { ProjectStage } from '../common/enums/project-stage.enum';
import { TokenAuthGuard } from '../common/guards/token-auth.guard';
import { TokenVerificationService } from '../common/services/token-verification.service';
import { Request } from 'express';

@ApiTags('projects')
@Controller('projects')
@UseGuards(TokenAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tokenVerificationService: TokenVerificationService
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau projet' })
  @ApiResponse({ status: 201, description: 'Projet créé avec succès', type: Project })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  async create(@Body() createProjectDto: CreateProjectDto, @Req() req: Request): Promise<Project> {
    const validatedToken = req['validatedToken'];
    console.log('Creating project with token:', validatedToken);
    
    try {
      const tokenData = await this.tokenVerificationService.verifyTokenAndGetUserInfo(validatedToken);
      const userEmail = tokenData.userInfo?.email || 'unknown@example.com';
      
      return this.projectsService.create(createProjectDto, userEmail);
    } catch (error) {
      console.error('Error getting user info from token:', error);
      return this.projectsService.create(createProjectDto);
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer tous les projets avec filtres optionnels' })
  @ApiResponse({ status: 200, description: 'Liste des projets', type: [Project] })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  async findAll(@Query() filters: FilterProjectsDto, @Req() req: Request): Promise<Project[]> {
    const validatedToken = req['validatedToken'];
    console.log('Fetching projects with token:', validatedToken);
    
    return this.projectsService.findAll(filters);
  }

  @Get('by-stage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les projets groupés par étape' })
  @ApiResponse({ status: 200, description: 'Projets groupés par étape' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  async getProjectsByStage(@Req() req: Request): Promise<Record<ProjectStage, Project[]>> {
    const validatedToken = req['validatedToken'];
    console.log('Fetching projects by stage with token:', validatedToken);
    
    return this.projectsService.getProjectsByStage();
  }

  @Get('upcoming-deadlines')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les projets avec deadlines proches' })
  @ApiQuery({ name: 'days', required: false, description: 'Nombre de jours (défaut: 7)' })
  @ApiResponse({ status: 200, description: 'Projets avec deadlines proches', type: [Project] })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  async getUpcomingDeadlines(@Req() req: Request, @Query('days') days?: string): Promise<Project[]> {
    const validatedToken = req['validatedToken'];
    console.log('Fetching upcoming deadlines with token:', validatedToken);
    
    const daysNumber = days ? parseInt(days, 10) : 7;
    return this.projectsService.getUpcomingDeadlines(daysNumber);
  }

  @Get('active-reminders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les projets avec rappels actifs' })
  @ApiResponse({ status: 200, description: 'Projets avec rappels actifs', type: [Project] })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  async getActiveReminders(@Req() req: Request): Promise<Project[]> {
    const validatedToken = req['validatedToken'];
    console.log('Fetching active reminders with token:', validatedToken);
    
    return this.projectsService.getActiveReminders();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer un projet par son ID' })
  @ApiResponse({ status: 200, description: 'Projet trouvé', type: Project })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async findOne(@Param('id') id: string, @Req() req: Request): Promise<Project> {
    const validatedToken = req['validatedToken'];
    console.log('Fetching project with token:', validatedToken);
    
    return this.projectsService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un projet' })
  @ApiResponse({ status: 200, description: 'Projet mis à jour', type: Project })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req: Request): Promise<Project> {
    const validatedToken = req['validatedToken'];
    console.log('Updating project with token:', validatedToken);
    
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id/stage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer l\'étape d\'un projet (drag & drop)' })
  @ApiResponse({ status: 200, description: 'Étape du projet mise à jour', type: Project })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 400, description: 'Changement d\'étape invalide' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async updateStage(@Param('id') id: string, @Body() updateStageDto: UpdateStageDto, @Req() req: Request): Promise<Project> {
    const validatedToken = req['validatedToken'];
    console.log('Updating project stage with token:', validatedToken);
    
    return this.projectsService.updateStage(id, updateStageDto.stage);
  }

  @Post(':id/users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter des utilisateurs à un projet' })
  @ApiResponse({ status: 200, description: 'Utilisateurs ajoutés avec succès', type: Project })
  @ApiResponse({ status: 400, description: 'Utilisateurs déjà dans l\'équipe' })
  @ApiResponse({ status: 404, description: 'Projet ou utilisateurs non trouvés' })
  async addUsersToProject(
    @Param('id') id: string,
    @Body() addUsersDto: AddUsersToProjectDto,
    @Req() req: Request
  ): Promise<Project> {
    const validatedToken = req['validatedToken'];
    console.log('Adding users to project with token:', validatedToken);
    
    return this.projectsService.addUsersToProject(id, addUsersDto);
  }

  @Delete(':id/users/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retirer un utilisateur d\'un projet' })
  @ApiResponse({ status: 200, description: 'Utilisateur retiré avec succès', type: Project })
  @ApiResponse({ status: 404, description: 'Projet ou utilisateur non trouvé' })
  async removeUserFromProject(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Req() req: Request
  ): Promise<Project> {
    const validatedToken = req['validatedToken'];
    console.log('Removing user from project with token:', validatedToken);
    
    return this.projectsService.removeUserFromProject(projectId, userId);
  }

  @Post(':id/substeps')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter une sous-étape à un projet' })
  @ApiResponse({ status: 201, description: 'Sous-étape ajoutée avec succès' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  addSubStep(
    @Param('id') projectId: string,
    @Body() subStepData: { title: string; description?: string }
  ) {
    return this.projectsService.addSubStep(projectId, subStepData);
  }

  @Patch(':id/substeps/:subStepId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour une sous-étape' })
  @ApiResponse({ status: 200, description: 'Sous-étape mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Projet ou sous-étape non trouvé' })
  updateSubStep(
    @Param('id') projectId: string,
    @Param('subStepId') subStepId: string,
    @Body() updateData: { title?: string; description?: string; isCompleted?: boolean; order?: number }
  ) {
    return this.projectsService.updateSubStep(projectId, subStepId, updateData);
  }

  @Patch(':id/substeps/:subStepId/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Basculer le statut de complétion d\'une sous-étape' })
  @ApiResponse({ status: 200, description: 'Statut de la sous-étape basculé avec succès' })
  @ApiResponse({ status: 404, description: 'Projet ou sous-étape non trouvé' })
  toggleSubStepCompletion(
    @Param('id') projectId: string,
    @Param('subStepId') subStepId: string
  ) {
    return this.projectsService.toggleSubStepCompletion(projectId, subStepId);
  }

  @Delete(':id/substeps/:subStepId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une sous-étape' })
  @ApiResponse({ status: 200, description: 'Sous-étape supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Projet ou sous-étape non trouvé' })
  deleteSubStep(
    @Param('id') projectId: string,
    @Param('subStepId') subStepId: string
  ) {
    return this.projectsService.deleteSubStep(projectId, subStepId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un projet' })
  @ApiResponse({ status: 204, description: 'Projet supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const validatedToken = req['validatedToken'];
    console.log('Deleting project with token:', validatedToken);
    
    return this.projectsService.remove(id);
  }
}