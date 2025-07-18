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
        console.log('response.analysis:', response.analysis);
        console.log('Tâches ML générées:', response.analysis?.project_tasks?.ml_generated_tasks);

        if (response.analysis?.project_tasks?.ml_generated_tasks && response.analysis.project_tasks.ml_generated_tasks.length > 0) {
          const tasks = response.analysis.project_tasks.ml_generated_tasks;
          
          console.log('Début de la création du projet avec tâches ML...');
          
          try {
            // 1. Créer le projet principal
            const projectData = {
              title: response.analysis.project_classification?.project_type || 'Projet IA',
              description: request.description,
              stage: 'IDEE',
              priority: 'MEDIUM',
              deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 jours
              tags: ['ia-generated'],
              teamIds: [],
              progress: 0
            };

            console.log('Création du projet:', projectData);

            const savedProject = await this.http.post(`${this.apiUrl}/projects`, projectData, { 
              headers: this.getAuthHeaders() 
            }).toPromise() as any;

            console.log('Projet créé avec succès:', savedProject);

            // 2. Ajouter les tâches au projet créé
            if (savedProject?.id) {
              console.log(`Ajout de ${tasks.length} tâches au projet ${savedProject.id}`);
              
              const savedTasks = [];
              for (const task of tasks) {
                try {
                  const taskData = {
                    title: task.name || 'Tâche IA',
                    description: task.description || 'Tâche générée par IA',
                    stage: 'PENDING',
                    priority: task.priority || 'MEDIUM',
                    projectId: savedProject.id,
                    progress: 0,
                    estimatedHours: task.estimatedHours || null,
                    deadline: null,
                    assignedTo: [],
                    tags: task.tags || []
                  };

                  const savedTask = await this.http.post(`${this.apiUrl}/project-management`, taskData, { 
                    headers: this.getAuthHeaders() 
                  }).toPromise();

                  savedTasks.push(savedTask);
                  console.log(`Tâche ajoutée: ${task.name}`);
                } catch (taskError) {
                  console.error('Erreur ajout tâche:', taskError);
                }
              }

              console.log(`Projet créé avec ${savedTasks.length}/${tasks.length} tâches`);
              
              return {
                success: true,
                message: `Projet créé avec ${savedTasks.length} tâches !`,
                projects: [{ ...savedProject, tasks: savedTasks }],
                analysis: response.analysis,
                suggestions: ['Projet et tâches créés avec succès']
              };
            }
          } catch (error) {
            console.error('Erreur création projet:', error);
            throw error;
          }
        }

        return {
          success: true,
          message: 'Analyse ML terminée mais aucune tâche générée',
          projects: [],
          analysis: response.analysis || {},
          suggestions: ['Aucune tâche générée par le ML']
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
        console.log('Structure détaillée:', response.analysis?.project_tasks);
        console.log('Tâches ML:', response.analysis?.project_tasks?.ml_generated_tasks);
        
        if (response.analysis?.project_tasks?.ml_generated_tasks && response.analysis.project_tasks.ml_generated_tasks.length > 0) {
          const tasks = response.analysis.project_tasks.ml_generated_tasks;
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
