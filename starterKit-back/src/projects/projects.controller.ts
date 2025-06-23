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
import { Request } from 'express';

@ApiTags('projects')
@Controller('projects')
@UseGuards(TokenAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau projet' })
  @ApiResponse({ status: 201, description: 'Projet créé avec succès', type: Project })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: Request): Project {
    const validatedToken = req['validatedToken'];
    console.log('Creating project with token:', validatedToken);
    
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer tous les projets avec filtres optionnels' })
  @ApiResponse({ status: 200, description: 'Liste des projets', type: [Project] })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  findAll(@Query() filters: FilterProjectsDto, @Req() req: Request): Project[] {
    const validatedToken = req['validatedToken'];
    console.log('Fetching projects with token:', validatedToken);
    
    return this.projectsService.findAll(filters);
  }

  @Get('by-stage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les projets groupés par étape' })
  @ApiResponse({ status: 200, description: 'Projets groupés par étape' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  getProjectsByStage(@Req() req: Request): Record<ProjectStage, Project[]> {
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
  getUpcomingDeadlines(@Req() req: Request, @Query('days') days?: string): Project[] {
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
  getActiveReminders(@Req() req: Request): Project[] {
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
  findOne(@Param('id') id: string, @Req() req: Request): Project {
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
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req: Request): Project {
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
  updateStage(@Param('id') id: string, @Body() updateStageDto: UpdateStageDto, @Req() req: Request): Project {
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
  addUsersToProject(
    @Param('id') id: string,
    @Body() addUsersDto: AddUsersToProjectDto,
    @Req() req: Request
  ): Project {
    const validatedToken = req['validatedToken'];
    console.log('Adding users to project with token:', validatedToken);
    
    return this.projectsService.addUsersToProject(id, addUsersDto);
  }

  @Delete(':id/users/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retirer un utilisateur d\'un projet' })
  @ApiResponse({ status: 200, description: 'Utilisateur retiré avec succès', type: Project })
  @ApiResponse({ status: 404, description: 'Projet ou utilisateur non trouvé' })
  removeUserFromProject(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Req() req: Request
  ): Project {
    const validatedToken = req['validatedToken'];
    console.log('Removing user from project with token:', validatedToken);
    
    return this.projectsService.removeUserFromProject(projectId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un projet' })
  @ApiResponse({ status: 204, description: 'Projet supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  remove(@Param('id') id: string, @Req() req: Request): void {
    const validatedToken = req['validatedToken'];
    console.log('Deleting project with token:', validatedToken);
    
    this.projectsService.remove(id);
  }
}