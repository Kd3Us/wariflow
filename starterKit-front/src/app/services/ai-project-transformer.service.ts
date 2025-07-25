import { Injectable } from '@angular/core';
import { ProjectStage } from '../models/project.model';
import { ProjectManagementStage } from '../models/project-management.model';
import { ProjectCreationData, TaskCreationData } from './project-creation.service';

export interface AIProject {
  name?: string;
  title?: string;
  description: string;
  tasks?: AITask[];
}

export interface AITask {
  name?: string;
  title?: string;
  description: string;
  priority?: string;
  estimatedHours?: number;
  deadline?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AIProjectTransformerService {

  transformAIProjectToProjectData(aiProject: AIProject, index: number, originalDescription: string, response?: any): ProjectCreationData {
    const recommendedName = response?.project_name?.recommended_name;
    
    return {
      title: recommendedName || aiProject.name || aiProject.title || `Projet IA ${index + 1} - ${originalDescription.substring(0, 30)}`,
      description: aiProject.description || originalDescription,
      stage: ProjectStage.IDEE,
      progress: 0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      teamIds: [],
      priority: 'MEDIUM',
      tags: []
    };
  }

  transformAITasksToTaskData(aiTasks: AITask[]): Omit<TaskCreationData, 'projectId'>[] {
    if (!aiTasks || aiTasks.length === 0) {
      return [];
    }

    return aiTasks.map(task => ({
      title: task.name || task.title || 'Tâche sans nom',
      description: task.description,
      stage: ProjectManagementStage.PENDING,
      priority: this.mapPriority(task.priority || 'MEDIUM'),
      progress: 0,
      estimatedHours: task.estimatedHours || undefined,
      deadline: task.deadline ? new Date(task.deadline) : undefined,
      assignedTo: [],
      tags: task.tags || []
    }));
  }

  validateAIProject(aiProject: any): aiProject is AIProject {
    return aiProject && 
           typeof aiProject === 'object' && 
           typeof aiProject.description === 'string';
  }

  validateAITask(aiTask: any): aiTask is AITask {
    return aiTask && 
           typeof aiTask === 'object' && 
           typeof aiTask.description === 'string';
  }

  sanitizeProjectTitle(title: string, maxLength: number = 100): string {
    if (!title || title.trim().length === 0) {
      return 'Projet sans titre';
    }
    
    return title.trim().substring(0, maxLength);
  }

  sanitizeDescription(description: string, maxLength: number = 500): string {
    if (!description || description.trim().length === 0) {
      return 'Aucune description fournie';
    }
    
    return description.trim().substring(0, maxLength);
  }

  private mapPriority(priority: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const upperPriority = priority.toUpperCase();
    switch (upperPriority) {
      case 'LOW':
      case 'FAIBLE':
      case 'BAS':
        return 'LOW';
      case 'HIGH':
      case 'HAUTE':
      case 'ÉLEVÉ':
      case 'ELEVE':
        return 'HIGH';
      case 'MEDIUM':
      case 'MOYENNE':
      case 'MOYEN':
      default:
        return 'MEDIUM';
    }
  }
}