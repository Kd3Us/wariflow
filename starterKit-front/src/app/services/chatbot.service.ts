import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AIClientService } from './ai-client.service';
import { ProjectStage } from '../models/project.model';
import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';

export interface GenerateProjectRequest {
  description: string;
  context?: string;
  targetAudience?: string;
  maxTasks?: number;
}

export interface ChatbotResponse {
  success: boolean;
  message: string;
  projects: any[];
  analysis: any;
  suggestions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = environment.apiProjectURL.replace('/projects', '') || 'http://localhost:3000';

  constructor(
    private aiClient: AIClientService,
    private http: HttpClient,
    private jwtService: JwtService
  ) {}

  private getAuthHeaders() {
    const token = this.jwtService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  generateProject(request: GenerateProjectRequest): Observable<ChatbotResponse> {
    console.log('Appel du microservice IA:', request);
    
    return this.aiClient.generateProjects({
      description: request.description,
      context: request.context,
      targetAudience: request.targetAudience,
      maxTasks: request.maxTasks || 5,
      includeAnalysis: true
    }).pipe(
      switchMap(async (response) => {
        console.log('STRUCTURE COMPLÈTE de la réponse IA:', JSON.stringify(response, null, 2));
        console.log('response.projects:', response.projects);
        console.log('Premier projet:', response.projects?.[0]);
        console.log('Tasks du premier projet:', response.projects?.[0]?.tasks);

        if (response.projects && response.projects.length > 0) {
          console.log('Début de la sauvegarde des projets...');
          
          try {
            const savedProjects = [];
            
            for (const project of response.projects) {
              console.log('Sauvegarde du projet:', project.title);
              
              const projectData = {
                title: project.title || project.name || 'Projet IA',
                description: project.description || 'Projet généré par IA',
                stage: this.mapStageToEnum(project.stage || 'IDEE'),
                priority: project.priority || 'MEDIUM',
                deadline: project.deadline ? new Date(project.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                tags: project.tags || [],
                teamIds: [],
                progress: 0
              };

              console.log('Données du projet à sauver:', projectData);

              try {
                const savedProject = await this.http.post(`${this.apiUrl}/projects`, projectData, { 
                  headers: this.getAuthHeaders() 
                }).toPromise() as any;

                console.log('Projet sauvé avec succès:', savedProject);
                savedProjects.push(savedProject);

                if (project.tasks && project.tasks.length > 0 && savedProject?.id) {
                  console.log(`Sauvegarde de ${project.tasks.length} tâches pour le projet ${savedProject.id}`);
                  
                  const savedTasks = [];
                  for (const task of project.tasks) {
                    try {
                      const taskData = {
                        title: task.name || task.title || 'Tâche IA',
                        description: task.description || 'Tâche générée par IA',
                        stage: 'PENDING',
                        priority: task.priority || 'MEDIUM',
                        projectId: savedProject.id,
                        progress: 0,
                        estimatedHours: task.estimatedHours || null,
                        deadline: task.deadline ? new Date(task.deadline) : null,
                        assignedTo: [],
                        tags: task.tags || []
                      };

                      const savedTask = await this.http.post(`${this.apiUrl}/project-management`, taskData, { 
                        headers: this.getAuthHeaders() 
                      }).toPromise();

                      savedTasks.push(savedTask);
                      console.log(`Tâche sauvée: ${task.name || task.title}`);
                    } catch (taskError) {
                      console.error('Erreur sauvegarde tâche:', taskError);
                    }
                  }
                  console.log(`${savedTasks.length}/${project.tasks.length} tâches sauvées pour le projet ${savedProject.id}`);
                }
              } catch (projectError) {
                console.error('Erreur sauvegarde projet:', projectError);
                throw projectError;
              }
            }

            console.log('Tous les projets sauvés avec succès:', savedProjects.length);
            return {
              success: true,
              message: `${savedProjects.length} projets générés et sauvés avec leurs tâches !`,
              projects: savedProjects,
              analysis: response.analysis || {},
              suggestions: response.suggestions || []
            };

          } catch (saveError) {
            console.error('Erreur lors de la sauvegarde:', saveError);
            return {
              success: false,
              message: 'Erreur lors de la sauvegarde des projets',
              projects: response.projects || [],
              analysis: response.analysis || {},
              suggestions: ['Erreur de sauvegarde: ' + (saveError as any)?.message || 'Erreur inconnue']
            };
          }
        }

        return {
          success: true,
          message: 'Projets générés via le microservice IA mais aucun projet à sauvegarder',
          projects: response.projects || [],
          analysis: response.analysis || {},
          suggestions: response.suggestions || []
        };
      }),
      catchError(error => {
        console.error('Erreur microservice IA:', error);
        return of({
          success: false,
          message: 'Erreur du microservice IA',
          projects: [],
          analysis: {},
          suggestions: ['Microservice IA indisponible: ' + (error?.message || 'Erreur inconnue')]
        });
      })
    );
  }

  generateTasksForProject(request: any): Observable<any[]> {
    console.log('Génération de tâches pour le projet:', request);
    
    return this.aiClient.generateProjects({
      description: request.description,
      context: request.context || '',
      targetAudience: request.targetAudience || '',
      projectId: request.projectId,
      maxTasks: request.maxTasks || 5,
      taskGeneration: true
    }).pipe(
      switchMap(async (response: any) => {
        console.log('Réponse IA pour tâches:', response);
        
        if (response.projects && response.projects.length > 0 && response.projects[0].tasks) {
          const tasks = response.projects[0].tasks;
          console.log(`Sauvegarde de ${tasks.length} tâches pour le projet ${request.projectId}`);
          
          const savedTasks = [];
          for (const task of tasks) {
            try {
              const taskData = {
                title: task.name || task.title || 'Tâche IA',
                description: task.description || 'Tâche générée par IA',
                stage: 'PENDING',
                priority: task.priority || 'MEDIUM',
                projectId: request.projectId,
                progress: 0,
                estimatedHours: task.estimatedHours || null,
                deadline: task.deadline ? new Date(task.deadline) : null,
                assignedTo: [],
                tags: task.tags || []
              };

              const savedTask = await this.http.post(`${this.apiUrl}/project-management`, taskData, { 
                headers: this.getAuthHeaders() 
              }).toPromise();

              savedTasks.push(savedTask);
              console.log(`Tâche sauvée: ${task.name || task.title}`);
            } catch (taskError) {
              console.error('Erreur sauvegarde tâche:', taskError);
            }
          }

          console.log(`${savedTasks.length}/${tasks.length} tâches sauvées`);
          return savedTasks;
        }

        console.log('Aucune tâche trouvée dans la réponse IA');
        return [];
      }),
      catchError((error: any) => {
        console.error('Erreur génération tâches:', error);
        return of([]);
      })
    );
  }

  testConnection(): Observable<boolean> {
    return this.aiClient.checkHealth().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private mapStageToEnum(stage: string): ProjectStage {
    const stageMap: { [key: string]: ProjectStage } = {
      'IDEE': ProjectStage.IDEE,
      'MVP': ProjectStage.MVP,
      'TRACTION': ProjectStage.TRACTION,
      'LEVEE': ProjectStage.LEVEE
    };
    
    return stageMap[stage.toUpperCase()] || ProjectStage.IDEE;
  }
}