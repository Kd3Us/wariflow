import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectManagementTask, ProjectManagementStage, TaskPriority } from './entities/project-management-task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ProjectsService } from '../projects/projects.service';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class ProjectManagementService {
  constructor(
    @InjectRepository(ProjectManagementTask)
    private taskRepository: Repository<ProjectManagementTask>,
    private readonly projectsService: ProjectsService,
    private readonly teamsService: TeamsService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<ProjectManagementTask> {
    try {
      // Vérifier que le projet existe
      await this.projectsService.findOne(createTaskDto.projectId);
      
      // Traiter les utilisateurs assignés si fournis
      let assignedUsers = [];
      if (createTaskDto.assignedTo && createTaskDto.assignedTo.length > 0) {
        // Si assignedTo contient des objets TeamMember complets, les utiliser directement
        // Sinon, si ce sont des IDs, les récupérer depuis le service teams
        const userPromises = createTaskDto.assignedTo.map(async (user) => {
          if (typeof user === 'string') {
            // Si c'est un ID, récupérer l'utilisateur complet
            const foundUser = await this.teamsService.findOne(user);
            if (!foundUser) {
              throw new BadRequestException(`Utilisateur avec l'ID ${user} non trouvé`);
            }
            return foundUser;
          }
          // Si c'est déjà un objet TeamMember, le retourner tel quel
          return user;
        });
        
        assignedUsers = await Promise.all(userPromises);
      }
      
      const task = this.taskRepository.create({
        title: createTaskDto.title,
        description: createTaskDto.description || '',
        stage: createTaskDto.stage || ProjectManagementStage.PENDING,
        progress: createTaskDto.progress || 0,
        deadline: createTaskDto.deadline ? new Date(createTaskDto.deadline) : null,
        projectId: createTaskDto.projectId,
        priority: createTaskDto.priority || TaskPriority.MEDIUM,
        tags: createTaskDto.tags || [],
        estimatedHours: createTaskDto.estimatedHours || null,
        actualHours: createTaskDto.actualHours || null,
        assignedTo: assignedUsers,
        comments: createTaskDto.comments || 0,
        attachments: createTaskDto.attachments || 0
      });

      return this.taskRepository.save(task);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(`Projet avec l'ID ${createTaskDto.projectId} non trouvé`);
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la création de la tâche');
    }
  }

  async findAll(): Promise<ProjectManagementTask[]> {
    return this.taskRepository.find({
      relations: ['assignedTo'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByProject(projectId: string): Promise<ProjectManagementTask[]> {
    return this.taskRepository.find({
      where: { projectId },
      relations: ['assignedTo'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<ProjectManagementTask> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo']
    });

    if (!task) {
      throw new NotFoundException(`Tâche avec l'ID ${id} non trouvée`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<ProjectManagementTask> {
    const task = await this.findOne(id);

    try {
      // Traiter les utilisateurs assignés si fournis dans la mise à jour
      if (updateTaskDto.assignedTo !== undefined) {
        if (updateTaskDto.assignedTo.length === 0) {
          // Si le tableau est vide, supprimer tous les utilisateurs assignés
          task.assignedTo = [];
        } else {
          // Traiter les nouveaux utilisateurs assignés
          const userPromises = updateTaskDto.assignedTo.map(async (user) => {
            if (typeof user === 'string') {
              // Si c'est un ID, récupérer l'utilisateur complet
              const foundUser = await this.teamsService.findOne(user);
              if (!foundUser) {
                throw new BadRequestException(`Utilisateur avec l'ID ${user} non trouvé`);
              }
              return foundUser;
            }
            // Si c'est déjà un objet TeamMember, le retourner tel quel
            return user;
          });
          
          task.assignedTo = await Promise.all(userPromises);
        }
      }

      // Créer un objet de mise à jour sans assignedTo pour éviter les conflits
      const { assignedTo, ...updateData } = updateTaskDto;

      // Mettre à jour les champs
      Object.assign(task, {
        ...updateData,
        deadline: updateTaskDto.deadline ? new Date(updateTaskDto.deadline) : task.deadline,
      });

      return this.taskRepository.save(task);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(`Projet avec l'ID ${updateTaskDto.projectId} non trouvé`);
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la mise à jour de la tâche');
    }
  }

  async updateStage(id: string, updateStageDto: UpdateStageDto): Promise<ProjectManagementTask> {
    const task = await this.findOne(id);
    
    task.stage = updateStageDto.stage;
    
    // Si la tâche passe à DONE, mettre la progression à 100%
    if (updateStageDto.stage === ProjectManagementStage.DONE) {
      task.progress = 100;
    }

    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Tâche avec l'ID ${id} non trouvée`);
    }
  }

  async assignUsers(taskId: string, userIds: string[]): Promise<ProjectManagementTask> {
    const task = await this.findOne(taskId);

    // Récupérer les utilisateurs actuellement assignés
    const currentAssigned = task.assignedTo || [];
    const currentAssignedIds = currentAssigned.map(member => member.id);
    
    // Récupérer les nouveaux utilisateurs à assigner
    const newAssignedMembers = [];
    
    for (const userId of userIds) {
      const userFound = await this.teamsService.findOne(userId);
      if (userFound && !currentAssignedIds.includes(userId)) {
        newAssignedMembers.push(userFound);
      }
    }

    // Combiner les utilisateurs actuels et les nouveaux
    task.assignedTo = [...currentAssigned, ...newAssignedMembers];

    return this.taskRepository.save(task);
  }

  async removeUser(taskId: string, userId: string): Promise<ProjectManagementTask> {
    const task = await this.findOne(taskId);
    
    if (task.assignedTo) {
      task.assignedTo = task.assignedTo.filter(member => member.id !== userId);
    }

    return this.taskRepository.save(task);
  }

  async getTasksByStage(projectId: string, stage: ProjectManagementStage): Promise<ProjectManagementTask[]> {
    return this.taskRepository.find({
      where: { projectId, stage },
      relations: ['assignedTo'],
      order: { createdAt: 'DESC' }
    });
  }

  async getTaskStatistics(projectId: string): Promise<any> {
    const tasks = await this.findByProject(projectId);
    
    const statistics = {
      total: tasks.length,
      pending: tasks.filter(t => t.stage === ProjectManagementStage.PENDING).length,
      inProgress: tasks.filter(t => t.stage === ProjectManagementStage.INPROGRESS).length,
      test: tasks.filter(t => t.stage === ProjectManagementStage.TEST).length,
      done: tasks.filter(t => t.stage === ProjectManagementStage.DONE).length,
      averageProgress: tasks.length > 0 ? tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length : 0,
      totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
    };

    return statistics;
  }
}
