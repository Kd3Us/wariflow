import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { ProjectStage } from '../models/project.model';
import { ProjectManagementTask, ProjectManagementStage } from '../models/project-management.model';
import { ProjectManagementService } from './project-management.service';
import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';

export interface ProjectCreationData {
  title: string;
  description: string;
  stage: ProjectStage;
  progress: number;
  deadline: Date;
  teamIds: string[];
  priority: string;
  tags: string[];
}

export interface TaskCreationData {
  title: string;
  description: string;
  stage: ProjectManagementStage;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId: string;
  progress: number;
  estimatedHours?: number;
  deadline?: Date;
  assignedTo: string[];
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectCreationService extends BaseHttpService {
  private apiUrl = environment.apiProjectURL.replace('/projects', '') || 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private projectManagementService: ProjectManagementService,
    jwtService: JwtService
  ) {
    super(jwtService);
  }

  // TODO FIX
  async createProject(projectData: ProjectCreationData): Promise<any> {
    return this.http.post(`${this.apiUrl}/projects`, projectData, { 
      headers: this.getAuthHeadersObject() 
    }).toPromise();
  }

  async createTask(taskData: TaskCreationData): Promise<ProjectManagementTask> {
    // Convertir TaskCreationData en format attendu par ProjectManagementService
    const taskForService: Omit<ProjectManagementTask, 'id' | 'createdAt' | 'updatedAt'> = {
      title: taskData.title,
      description: taskData.description,
      stage: taskData.stage,
      progress: taskData.progress,
      deadline: taskData.deadline,
      assignedTo: [], // Les IDs seront convertis en TeamMember plus tard si nécessaire
      projectId: taskData.projectId,
      priority: taskData.priority,
      tags: taskData.tags,
      estimatedHours: taskData.estimatedHours,
      actualHours: 0,
      comments: 0,
      attachments: 0
    };

    const result = await this.projectManagementService.createTask(taskForService).toPromise();
    if (!result) {
      throw new Error('Échec de la création de la tâche');
    }
    return result;
  }

  async createProjectWithTasks(projectData: ProjectCreationData, tasks: Omit<TaskCreationData, 'projectId'>[]): Promise<{project: any, tasks: any[]}> {
    try {
      // Créer le projet
      const savedProject = await this.createProject(projectData);
      
      if (!savedProject) {
        throw new Error('Échec de la création du projet');
      }

      // Créer les tâches si elles existent
      const savedTasks: any[] = [];
      if (tasks && tasks.length > 0) {
        console.log(`💾 Sauvegarde de ${tasks.length} tâches pour le projet ${savedProject.id}`);
        
        const taskPromises = tasks.map(task => 
          
          this.createTask({
            ...task,
            projectId: savedProject.id
          })
        );

        const taskResults = await Promise.all(taskPromises);
        savedTasks.push(...taskResults);
        console.log(`✅ ${tasks.length} tâches sauvées pour le projet ${savedProject.id}`);
      }

      return { project: savedProject, tasks: savedTasks };
    } catch (error) {
      console.error('❌ Erreur lors de la création du projet avec tâches:', error);
      throw error;
    }
  }
}
