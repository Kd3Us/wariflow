import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddUsersToProjectDto } from './dto/add-users-to-project.dto';
import { FilterProjectsDto } from './dto/filter-projects.dto';
import { ProjectStage, PROJECT_STAGE_ORDER } from '../common/enums/project-stage.enum';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private readonly teamsService: TeamsService,
  ) {}

  async create(createProjectDto: CreateProjectDto, organization?: string): Promise<Project> {
    const teamMembers = await this.teamsService.findByIds(createProjectDto.teamIds);
    
    const project = this.projectRepository.create({
      ...createProjectDto,
      team: teamMembers,
      comments: 0,
      attachments: 0,
      isReminderActive: !!createProjectDto.reminderDate,
      priority: createProjectDto.priority || 'MEDIUM',
      tags: createProjectDto.tags || [],
      organisation: organization,
    });

    return this.projectRepository.save(project);
  }


  async findAll(filters?: FilterProjectsDto): Promise<Project[]> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.team', 'team');

    if (filters) {
      if (filters.stage) {
        queryBuilder.andWhere('project.stage = :stage', { stage: filters.stage });
      }

      if (filters.priority) {
        queryBuilder.andWhere('project.priority = :priority', { priority: filters.priority });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(LOWER(project.title) LIKE LOWER(:search) OR LOWER(project.description) LIKE LOWER(:search) OR project.tags::text ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      if (filters.deadlineInDays) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + filters.deadlineInDays);
        queryBuilder.andWhere('project.deadline <= :targetDate', { targetDate });
      }

      if (filters.hasActiveReminder !== undefined) {
        queryBuilder.andWhere('project.isReminderActive = :hasActiveReminder', { 
          hasActiveReminder: filters.hasActiveReminder 
        });
      }

      if (filters.organisation) {
        queryBuilder.andWhere('project.organisation = :organisation', { 
          organisation: filters.organisation 
        });
      }

      if (filters.sortBy) {
        const order = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
        switch (filters.sortBy) {
          case 'deadline':
            queryBuilder.orderBy('project.deadline', order);
            break;
          case 'progress':
            queryBuilder.orderBy('project.progress', order);
            break;
          case 'createdAt':
          default:
            queryBuilder.orderBy('project.createdAt', order);
            break;
        }
      }
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['team']
    });
    
    if (!project) {
      throw new NotFoundException(`Projet avec l'ID ${id} non trouvé`);
    }
    
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    
    if (updateProjectDto.teamIds) {
      const teamMembers = await this.teamsService.findByIds(updateProjectDto.teamIds);
      project.team = teamMembers;
      delete updateProjectDto.teamIds;
    }

    if (updateProjectDto.reminderDate !== undefined) {
      project.isReminderActive = !!updateProjectDto.reminderDate;
    }

    Object.assign(project, updateProjectDto);
    
    return this.projectRepository.save(project);
  }

  async updateStage(id: string, newStage: ProjectStage): Promise<Project> {
    const project = await this.findOne(id);
    
    const currentStageIndex = PROJECT_STAGE_ORDER.indexOf(project.stage);
    const newStageIndex = PROJECT_STAGE_ORDER.indexOf(newStage);
    
    if (newStageIndex < currentStageIndex - 1 || newStageIndex > currentStageIndex + 1) {
      throw new BadRequestException(
        `Impossible de passer directement de ${project.stage} à ${newStage}. Les étapes doivent être consécutives.`
      );
    }

    return this.update(id, { stage: newStage });
  }

  async addUsersToProject(id: string, addUsersDto: AddUsersToProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    const usersToAdd = await this.teamsService.findByIds(addUsersDto.userIds);
    
    const existingUserIds = project.team.map(member => member.id);
    const newUsers = usersToAdd.filter(user => !existingUserIds.includes(user.id));
    
    if (newUsers.length === 0) {
      throw new BadRequestException('Tous les utilisateurs sont déjà dans l\'équipe du projet');
    }
    
    project.team.push(...newUsers);
    
    return this.projectRepository.save(project);
  }

  async removeUserFromProject(projectId: string, userId: string): Promise<Project> {
    const project = await this.findOne(projectId);
    const userIndex = project.team.findIndex(member => member.id === userId);
    
    if (userIndex === -1) {
      throw new NotFoundException('Utilisateur non trouvé dans l\'équipe du projet');
    }
    
    project.team.splice(userIndex, 1);
    
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Projet avec l'ID ${id} non trouvé`);
    }
  }

  async getProjectsByStage(): Promise<Record<ProjectStage, Project[]>> {
    const projects = await this.findAll();
    
    const projectsByStage = {
      [ProjectStage.IDEE]: [],
      [ProjectStage.MVP]: [],
      [ProjectStage.TRACTION]: [],
      [ProjectStage.LEVEE]: [],
    };

    projects.forEach(project => {
      projectsByStage[project.stage].push(project);
    });

    return projectsByStage;
  }

  async getUpcomingDeadlines(days: number = 7): Promise<Project[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    return this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.team', 'team')
      .where('project.deadline <= :targetDate', { targetDate })
      .andWhere('project.deadline >= :now', { now: new Date() })
      .orderBy('project.deadline', 'ASC')
      .getMany();
  }

  async getActiveReminders(): Promise<Project[]> {
    return this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.team', 'team')
      .where('project.isReminderActive = :isActive', { isActive: true })
      .andWhere('project.reminderDate IS NOT NULL')
      .andWhere('project.reminderDate <= :now', { now: new Date() })
      .orderBy('project.reminderDate', 'ASC')
      .getMany();
  }

  async findByOrganisation(organisation: string): Promise<Project[]> {
    return this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.team', 'team')
      .where('project.organisation = :organisation', { organisation })
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async getProjectsByOrganisationAndStage(organisation: string): Promise<Record<ProjectStage, Project[]>> {
    const projects = await this.findByOrganisation(organisation);
    
    const projectsByStage = {
      [ProjectStage.IDEE]: [],
      [ProjectStage.MVP]: [],
      [ProjectStage.TRACTION]: [],
      [ProjectStage.LEVEE]: [],
    };

    projects.forEach(project => {
      projectsByStage[project.stage].push(project);
    });

    return projectsByStage;
  }
}
