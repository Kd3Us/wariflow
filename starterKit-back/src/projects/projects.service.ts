import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectsDto } from './dto/filter-projects.dto';
import { ProjectStage, PROJECT_STAGE_ORDER } from '../common/enums/project-stage.enum';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class ProjectsService {
  private projects: Project[] = [];

  constructor(private readonly teamsService: TeamsService) {
    this.initializeMockData();
  }

  private initializeMockData() {
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
        title: 'Dashboard Analytics',
        description: 'Développement du tableau de bord analytics avec métriques en temps réel',
        stage: ProjectStage.IDEE,
        progress: 15,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        team: [teamMembers[1], teamMembers[4]],
        comments: 8,
        attachments: 1,
        isReminderActive: true,
        reminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'LOW',
        tags: ['analytics', 'dashboard', 'metrics'],
        instructions: []
      }
    ];
  }

  create(createProjectDto: CreateProjectDto): Project {
    const teamMembers = this.teamsService.findByIds(createProjectDto.teamIds);
    
    const project: Project = {
      id: uuidv4(),
      ...createProjectDto,
      team: teamMembers,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: 0,
      attachments: 0,
      isReminderActive: !!createProjectDto.reminderDate,
      priority: createProjectDto.priority || 'MEDIUM',
      tags: createProjectDto.tags || [],
      instructions: createProjectDto.instructions || [],
    };

    this.projects.push(project);
    return project;
  }

  findAll(filters?: FilterProjectsDto): Project[] {
    let filteredProjects = [...this.projects];

    if (filters) {
      if (filters.stage) {
        filteredProjects = filteredProjects.filter(p => p.stage === filters.stage);
      }

      if (filters.priority) {
        filteredProjects = filteredProjects.filter(p => p.priority === filters.priority);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProjects = filteredProjects.filter(p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters.deadlineInDays) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + filters.deadlineInDays);
        filteredProjects = filteredProjects.filter(p => p.deadline <= targetDate);
      }

      if (filters.hasActiveReminder !== undefined) {
        filteredProjects = filteredProjects.filter(p => p.isReminderActive === filters.hasActiveReminder);
      }

      if (filters.sortBy) {
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        filteredProjects.sort((a, b) => {
          let aValue, bValue;
          
          switch (filters.sortBy) {
            case 'deadline':
              aValue = a.deadline.getTime();
              bValue = b.deadline.getTime();
              break;
            case 'progress':
              aValue = a.progress;
              bValue = b.progress;
              break;
            case 'createdAt':
            default:
              aValue = a.createdAt.getTime();
              bValue = b.createdAt.getTime();
              break;
          }
          
          return (aValue - bValue) * order;
        });
      }
    }

    return filteredProjects;
  }

  findOne(id: string): Project {
    const project = this.projects.find(p => p.id === id);
    if (!project) {
      throw new NotFoundException(`Projet avec l'ID ${id} non trouvé`);
    }
    return project;
  }

  update(id: string, updateProjectDto: UpdateProjectDto): Project {
    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      throw new NotFoundException(`Projet avec l'ID ${id} non trouvé`);
    }

    const project = this.projects[projectIndex];
    
    if (updateProjectDto.teamIds) {
      const teamMembers = this.teamsService.findByIds(updateProjectDto.teamIds);
      updateProjectDto['team'] = teamMembers;
      delete updateProjectDto.teamIds;
    }

    if (updateProjectDto.reminderDate !== undefined) {
      updateProjectDto['isReminderActive'] = !!updateProjectDto.reminderDate;
    }

    this.projects[projectIndex] = {
      ...project,
      ...updateProjectDto,
      updatedAt: new Date(),
    };

    return this.projects[projectIndex];
  }

  updateStage(id: string, newStage: ProjectStage): Project {
    const project = this.findOne(id);
    
    const currentStageIndex = PROJECT_STAGE_ORDER.indexOf(project.stage);
    const newStageIndex = PROJECT_STAGE_ORDER.indexOf(newStage);
    
    if (newStageIndex < currentStageIndex - 1 || newStageIndex > currentStageIndex + 1) {
      throw new BadRequestException(
        `Impossible de passer directement de ${project.stage} à ${newStage}. Les étapes doivent être consécutives.`
      );
    }

    return this.update(id, { stage: newStage });
  }

  remove(id: string): void {
    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      throw new NotFoundException(`Projet avec l'ID ${id} non trouvé`);
    }
    this.projects.splice(projectIndex, 1);
  }

  getProjectsByStage(): Record<ProjectStage, Project[]> {
    const projectsByStage = {
      [ProjectStage.IDEE]: [],
      [ProjectStage.MVP]: [],
      [ProjectStage.TRACTION]: [],
      [ProjectStage.LEVEE]: [],
    };

    this.projects.forEach(project => {
      projectsByStage[project.stage].push(project);
    });

    return projectsByStage;
  }

  getUpcomingDeadlines(days: number = 7): Project[] {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    return this.projects
      .filter(p => p.deadline <= targetDate && p.deadline >= new Date())
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }

  getActiveReminders(): Project[] {
    return this.projects
      .filter(p => p.isReminderActive && p.reminderDate && p.reminderDate <= new Date())
      .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());
  }
}