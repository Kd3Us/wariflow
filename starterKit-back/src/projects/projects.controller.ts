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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddUsersToProjectDto } from './dto/add-users-to-project.dto';
import { FilterProjectsDto } from './dto/filter-projects.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { Project } from './entities/project.entity';
import { ProjectStage } from '../common/enums/project-stage.enum';
import { Request } from 'express';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau projet' })
  @ApiResponse({ status: 201, description: 'Projet créé avec succès', type: Project })
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: Request): Project {
    console.log('Creating project (auth bypassed)');
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les projets avec filtres optionnels' })
  @ApiResponse({ status: 200, description: 'Liste des projets', type: [Project] })
  findAll(@Query() filters: FilterProjectsDto, @Req() req: Request): Project[] {
    console.log('Fetching projects (auth bypassed)');
    return this.projectsService.findAll(filters);
  }

  @Get('by-stage')
  @ApiOperation({ summary: 'Récupérer les projets groupés par étape' })
  @ApiResponse({ status: 200, description: 'Projets groupés par étape' })
  getProjectsByStage(@Req() req: Request): Record<ProjectStage, Project[]> {
    console.log('Fetching projects by stage (auth bypassed)');
    return this.projectsService.getProjectsByStage();
  }

  @Get('upcoming-deadlines')
  @ApiOperation({ summary: 'Récupérer les projets avec deadlines proches' })
  @ApiQuery({ name: 'days', required: false, description: 'Nombre de jours (défaut: 7)' })
  @ApiResponse({ status: 200, description: 'Projets avec deadlines proches', type: [Project] })
  getUpcomingDeadlines(@Req() req: Request, @Query('days') days?: string): Project[] {
    console.log('Fetching upcoming deadlines (auth bypassed)');
    const daysNumber = days ? parseInt(days, 10) : 7;
    return this.projectsService.getUpcomingDeadlines(daysNumber);
  }

  @Get('active-reminders')
  @ApiOperation({ summary: 'Récupérer les projets avec rappels actifs' })
  @ApiResponse({ status: 200, description: 'Projets avec rappels actifs', type: [Project] })
  getActiveReminders(@Req() req: Request): Project[] {
    console.log('Fetching active reminders (auth bypassed)');
    return this.projectsService.getActiveReminders();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un projet par son ID' })
  @ApiResponse({ status: 200, description: 'Projet trouvé', type: Project })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  findOne(@Param('id') id: string, @Req() req: Request): Project {
    console.log('Fetching project (auth bypassed)');
    return this.projectsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un projet' })
  @ApiResponse({ status: 200, description: 'Projet mis à jour', type: Project })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req: Request): Project {
    console.log('Updating project (auth bypassed)');
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Changer l\'étape d\'un projet (drag & drop)' })
  @ApiResponse({ status: 200, description: 'Étape du projet mise à jour', type: Project })
  @ApiResponse({ status: 400, description: 'Changement d\'étape invalide' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  updateStage(@Param('id') id: string, @Body() updateStageDto: UpdateStageDto, @Req() req: Request): Project {
    console.log('Updating project stage (auth bypassed)');
    return this.projectsService.updateStage(id, updateStageDto.stage);
  }

  @Post(':id/users')
  @ApiOperation({ summary: 'Ajouter des utilisateurs à un projet' })
  @ApiResponse({ status: 200, description: 'Utilisateurs ajoutés avec succès', type: Project })
  @ApiResponse({ status: 400, description: 'Utilisateurs déjà dans l\'équipe' })
  @ApiResponse({ status: 404, description: 'Projet ou utilisateurs non trouvés' })
  addUsersToProject(
    @Param('id') id: string,
    @Body() addUsersDto: AddUsersToProjectDto,
    @Req() req: Request
  ): Project {
    console.log('Adding users to project (auth bypassed)');
    return this.projectsService.addUsersToProject(id, addUsersDto);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({ summary: 'Retirer un utilisateur d\'un projet' })
  @ApiResponse({ status: 200, description: 'Utilisateur retiré avec succès', type: Project })
  @ApiResponse({ status: 404, description: 'Projet ou utilisateur non trouvé' })
  removeUserFromProject(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Req() req: Request
  ): Project {
    console.log('Removing user from project (auth bypassed)');
    return this.projectsService.removeUserFromProject(projectId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un projet' })
  @ApiResponse({ status: 204, description: 'Projet supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  remove(@Param('id') id: string, @Req() req: Request): void {
    console.log('Deleting project (auth bypassed)');
    this.projectsService.remove(id);
  }
}