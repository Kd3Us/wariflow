import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddUsersToProjectDto } from './dto/add-users-to-project.dto';
import { FilterProjectsDto } from './dto/filter-projects.dto';
import { ProjectStage, PROJECT_STAGE_ORDER } from '../common/enums/project-stage.enum';
import { TeamsService } from '../teams/teams.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class ProjectsService {
  private projects: Project[] = [];

  constructor(
    private readonly teamsService: TeamsService,
    private readonly logger: LoggerService
  ) {
    this.initializeMockData();
  }

  private initializeMockData() {
    this.logger.log('Initialisation des données mock des projets', 'ProjectsService');
    const teamMembers = this.teamsService.findAll();
    
    this.projects = [
      {
        id: uuidv4(),
        title: 'Landing Page Redesign',
        description: 'Refonte complète de la landing page avec nouveau design et optimisation UX',
        stage: ProjectStage.MVP,
        progress: 70,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        team: [teamMembers[0], teamMembers[1], teamMembers[2]],
        comments: 6,
        attachments: 4,
        isReminderActive: true,
        reminderDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: 'HIGH',
        tags: ['design', 'frontend', 'urgent'],
        instructions: []
      },
      {
        id: uuidv4(),
        title: 'API Mobile Integration',
        description: 'Intégration des APIs mobiles pour l\'application native',
        stage: ProjectStage.TRACTION,
        progress: 45,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        team: [teamMembers[2], teamMembers[3]],
        comments: 3,
        attachments: 2,
        isReminderActive: false,
        priority: 'MEDIUM',
        tags: ['mobile', 'api', 'integration'],
        instructions: []
      },
      {
        id: uuidv4(),
        title: 'E-commerce Platform',
        description: 'Développement d\'une plateforme e-commerce complète avec paiements sécurisés',
        stage: ProjectStage.IDEE,
        progress: 15,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        team: [teamMembers[0], teamMembers[4]],
        comments: 8,
        attachments: 1,
        isReminderActive: true,
        reminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'HIGH',
        tags: ['e-commerce', 'backend', 'fintech'],
        instructions: []
      }
    ];
    
    this.logger.log(`${this.projects.length} projets mock initialisés avec succès`, 'ProjectsService');
  }

  findAll(filters?: FilterProjectsDto): Project[] {
    this.logger.log(`Récupération de tous les projets avec filtres: ${JSON.stringify(filters || {})}`, 'ProjectsService');
    
    let filteredProjects = [...this.projects];

    if (filters) {
      if (filters.stage) {
        filteredProjects = filteredProjects.filter(p => p.stage === filters.stage);
        this.logger.debug(`Filtrage par stage '${filters.stage}': ${filteredProjects.length} projets`, 'ProjectsService');
      }
      
      if (filters.priority) {
        filteredProjects = filteredProjects.filter(p => p.priority === filters.priority);
        this.logger.debug(`Filtrage par priorité '${filters.priority}': ${filteredProjects.length} projets`, 'ProjectsService');
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProjects = filteredProjects.filter(p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
        this.logger.debug(`Recherche textuelle '${filters.search}': ${filteredProjects.length} projets trouvés`, 'ProjectsService');
      }

      if (filters.deadlineInDays) {
        const targetDate = new Date(Date.now() + filters.deadlineInDays * 24 * 60 * 60 * 1000);
        filteredProjects = filteredProjects.filter(p => p.deadline && p.deadline <= targetDate);
        this.logger.debug(`Filtrage par deadline dans ${filters.deadlineInDays} jours: ${filteredProjects.length} projets`, 'ProjectsService');
      }

      if (filters.hasActiveReminder !== undefined) {
        filteredProjects = filteredProjects.filter(p => p.isReminderActive === filters.hasActiveReminder);
        this.logger.debug(`Filtrage par rappels actifs: ${filteredProjects.length} projets`, 'ProjectsService');
      }

      if (filters.sortBy) {
        const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
        filteredProjects.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (filters.sortBy) {
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            case 'deadline':
              aValue = a.deadline ? new Date(a.deadline).getTime() : 0;
              bValue = b.deadline ? new Date(b.deadline).getTime() : 0;
              break;
            case 'progress':
              aValue = a.progress;
              bValue = b.progress;
              break;
            default:
              return 0;
          }

          return aValue < bValue ? -sortOrder : aValue > bValue ? sortOrder : 0;
        });
        this.logger.debug(`Tri par '${filters.sortBy}' ordre '${filters.sortOrder}' appliqué`, 'ProjectsService');
      }
    }

    this.logger.log(`${filteredProjects.length} projets retournés après filtrage`, 'ProjectsService');
    return filteredProjects;
  }

  getByStage(): Record<string, Project[]> {
    this.logger.log('Récupération des projets groupés par stage', 'ProjectsService');
    
    const projectsByStage: Record<string, Project[]> = {};
    
    Object.values(ProjectStage).forEach(stage => {
      projectsByStage[stage] = this.projects.filter(p => p.stage === stage);
    });

    this.logger.log(`Projets groupés par stage: ${Object.entries(projectsByStage).map(([stage, projects]) => `${stage}:${projects.length}`).join(', ')}`, 'ProjectsService');
    return projectsByStage;
  }

  getProjectsByStage(): Record<string, Project[]> {
    return this.getByStage();
  }

  getUpcomingDeadlines(days: number = 7): Project[] {
    this.logger.log(`Récupération des projets avec deadline dans ${days} jours`, 'ProjectsService');
    
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const upcomingProjects = this.projects.filter(p => 
      p.deadline && p.deadline <= targetDate && p.deadline >= new Date()
    );

    this.logger.log(`${upcomingProjects.length} projets avec deadline proche trouvés`, 'ProjectsService');
    return upcomingProjects;
  }

  getActiveReminders(): Project[] {
    this.logger.log('Récupération des projets avec rappels actifs', 'ProjectsService');
    
    const activeRemindersProjects = this.projects.filter(p => p.isReminderActive);
    
    this.logger.log(`${activeRemindersProjects.length} projets avec rappels actifs trouvés`, 'ProjectsService');
    return activeRemindersProjects;
  }

  findOne(id: string): Project {
    this.logger.log(`Recherche du projet avec ID: ${id}`, 'ProjectsService');
    
    const project = this.projects.find(p => p.id === id);
    if (!project) {
      this.logger.warn(`Projet avec l'ID ${id} non trouvé`, 'ProjectsService');
      throw new NotFoundException(`Projet avec l'ID ${id} non trouvé`);
    }
    
    this.logger.log(`Projet trouvé: ${project.title}`, 'ProjectsService');
    return project;
  }

  create(createProjectDto: CreateProjectDto): Project {
    this.logger.log(`Création d'un nouveau projet: ${createProjectDto.title}`, 'ProjectsService');
    
    try {
      const teamMembers = this.teamsService.findByIds(createProjectDto.teamIds || []);
      
      const newProject: Project = {
        id: uuidv4(),
        title: createProjectDto.title,
        description: createProjectDto.description,
        stage: createProjectDto.stage,
        progress: createProjectDto.progress || 0,
        deadline: createProjectDto.deadline,
        priority: createProjectDto.priority || 'MEDIUM',
        tags: createProjectDto.tags || [],
        reminderDate: createProjectDto.reminderDate,
        team: teamMembers,
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: 0,
        attachments: 0,
        isReminderActive: !!createProjectDto.reminderDate,
        instructions: []
      };

      this.projects.push(newProject);
      this.logger.log(`Projet créé avec succès - ID: ${newProject.id}, Titre: ${newProject.title}`, 'ProjectsService');
      
      return newProject;
    } catch (error) {
      this.logger.error(`Erreur lors de la création du projet: ${error.message}`, error.stack, 'ProjectsService');
      throw error;
    }
  }

  update(id: string, updateProjectDto: UpdateProjectDto): Project {
    this.logger.log(`Mise à jour du projet ${id}`, 'ProjectsService');
    
    try {
      const project = this.findOne(id);
      
      if (updateProjectDto.teamIds) {
        const teamMembers = this.teamsService.findByIds(updateProjectDto.teamIds);
        project.team = teamMembers;
        this.logger.debug(`Équipe mise à jour pour le projet ${id}: ${teamMembers.length} membres`, 'ProjectsService');
        const { teamIds, ...updateData } = updateProjectDto;
        Object.assign(project, updateData, { updatedAt: new Date() });
      } else {
        Object.assign(project, updateProjectDto, { updatedAt: new Date() });
      }

      this.logger.log(`Projet ${id} mis à jour avec succès`, 'ProjectsService');
      return project;
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour du projet ${id}: ${error.message}`, error.stack, 'ProjectsService');
      throw error;
    }
  }

  updateStage(id: string, newStage: ProjectStage): Project {
    this.logger.log(`Changement de stage du projet ${id} vers ${newStage}`, 'ProjectsService');
    
    try {
      const project = this.findOne(id);
      
      const currentStageIndex = PROJECT_STAGE_ORDER.indexOf(project.stage);
      const newStageIndex = PROJECT_STAGE_ORDER.indexOf(newStage);

      if (Math.abs(newStageIndex - currentStageIndex) > 1) {
        this.logger.warn(`Tentative de changement de stage invalide: ${project.stage} vers ${newStage}`, 'ProjectsService');
        throw new BadRequestException(
          `Impossible de passer de ${project.stage} à ${newStage}. Les transitions ne peuvent se faire que vers l'étape suivante ou précédente.`
        );
      }

      const oldStage = project.stage;
      project.stage = newStage;
      project.updatedAt = new Date();

      this.logger.log(`Stage du projet ${id} changé avec succès: ${oldStage} → ${newStage}`, 'ProjectsService');
      return project;
    } catch (error) {
      this.logger.error(`Erreur lors du changement de stage du projet ${id}: ${error.message}`, error.stack, 'ProjectsService');
      throw error;
    }
  }

  addUsersToProject(id: string, addUsersDto: AddUsersToProjectDto): Project {
    this.logger.log(`Ajout d'utilisateurs au projet ${id}: ${JSON.stringify(addUsersDto.userIds)}`, 'ProjectsService');
    
    try {
      const project = this.findOne(id);
      const usersToAdd = this.teamsService.findByIds(addUsersDto.userIds);
      
      const existingUserIds = project.team.map(member => member.id);
      const newUsers = usersToAdd.filter(user => !existingUserIds.includes(user.id));
      
      if (newUsers.length === 0) {
        this.logger.warn(`Aucun nouvel utilisateur à ajouter au projet ${id} - tous sont déjà membres`, 'ProjectsService');
        throw new BadRequestException('Tous les utilisateurs sont déjà dans l\'équipe du projet');
      }
      
      project.team.push(...newUsers);
      project.updatedAt = new Date();
      
      this.logger.log(`${newUsers.length} utilisateurs ajoutés au projet ${id}: ${newUsers.map(u => u.name).join(', ')}`, 'ProjectsService');
      return project;
    } catch (error) {
      this.logger.error(`Erreur lors de l'ajout d'utilisateurs au projet ${id}: ${error.message}`, error.stack, 'ProjectsService');
      throw error;
    }
  }

  removeUserFromProject(projectId: string, userId: string): Project {
    this.logger.log(`Suppression de l'utilisateur ${userId} du projet ${projectId}`, 'ProjectsService');
    
    try {
      const project = this.findOne(projectId);
      const userIndex = project.team.findIndex(member => member.id === userId);
      
      if (userIndex === -1) {
        this.logger.warn(`Utilisateur ${userId} non trouvé dans le projet ${projectId}`, 'ProjectsService');
        throw new NotFoundException('Utilisateur non trouvé dans l\'équipe du projet');
      }
      
      const removedUser = project.team[userIndex];
      project.team.splice(userIndex, 1);
      project.updatedAt = new Date();
      
      this.logger.log(`Utilisateur ${removedUser.name} (${userId}) supprimé du projet ${projectId}`, 'ProjectsService');
      return project;
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression de l'utilisateur ${userId} du projet ${projectId}: ${error.message}`, error.stack, 'ProjectsService');
      throw error;
    }
  }

  remove(id: string): void {
    this.logger.log(`Suppression du projet ${id}`, 'ProjectsService');
    
    try {
      const index = this.projects.findIndex(p => p.id === id);
      if (index === -1) {
        this.logger.warn(`Projet ${id} non trouvé pour suppression`, 'ProjectsService');
        throw new NotFoundException(`Projet avec l'ID ${id} non trouvé`);
      }
      
      const deletedProject = this.projects[index];
      this.projects.splice(index, 1);
      this.logger.log(`Projet '${deletedProject.title}' (${id}) supprimé avec succès`, 'ProjectsService');
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression du projet ${id}: ${error.message}`, error.stack, 'ProjectsService');
      throw error;
    }
  }
}