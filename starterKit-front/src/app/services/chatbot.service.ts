import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AIClientService } from './ai-client.service';
import { ProjectCreationService } from './project-creation.service';
import { AIProjectTransformerService, AIProject } from './ai-project-transformer.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';


export interface GenerateProjectRequest {
  description: string;
  context?: string;
  targetAudience?: string;
}

export interface ChatbotResponse {
  success: boolean;
  message: string;
  projects: any[];
  analysis: any;
  suggestions: string[];
}

export interface AIResponse {
  success: boolean;
  projects: AIProject[];
  analysis?: any;
  suggestions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {


  private apiUrl = environment.apiProjectURL.replace('/projects', '') || 'http://localhost:3000';

  constructor(
    private aiClient: AIClientService,
    private projectCreationService: ProjectCreationService,
    private aiTransformer: AIProjectTransformerService,
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
    return this.aiClient.generateProjects({
      description: request.description,
      context: request.context,
      targetAudience: request.targetAudience,
      includeAnalysis: true
    }).pipe(
      switchMap(response => this.processAIResponse(response, request)),
      catchError(error => this.handleError(error))
    );
  }

  private processAIResponse(response: AIResponse, request: GenerateProjectRequest): Observable<ChatbotResponse> {
    if (!response.projects || response.projects.length === 0) {
      return of({
        success: true,
        message: 'Aucun projet généré par le microservice IA',
        projects: [],
        analysis: response.analysis || {},
        suggestions: response.suggestions || []
      });
    }

    return this.saveProjectsWithTasks(response.projects, request).pipe(
      map(savedProjects => ({
        success: true,
        message: `${savedProjects.length} projets générés et sauvés avec leurs tâches !`,
        projects: savedProjects,
        analysis: response.analysis || {},
        suggestions: response.suggestions || []
      })),
      catchError(saveError => {
        console.error('❌ Erreur sauvegarde:', saveError);
        return of({
          success: true,
          message: 'Projets générés mais erreur lors de la sauvegarde',
          projects: response.projects || [],
          analysis: response.analysis || {},
          suggestions: response.suggestions || ['Erreur de sauvegarde locale']
        });
      })
    );
  }

  private saveProjectsWithTasks(aiProjects: AIProject[], request: GenerateProjectRequest): Observable<any[]> {
    const savePromises = aiProjects
      .filter(project => this.aiTransformer.validateAIProject(project))
      .map(async (project, index) => {
        try {
          console.log(`💾 Traitement du projet ${index + 1}:`, project);
          
          // Transformer les données IA en données de projet
          const projectData = this.aiTransformer.transformAIProjectToProjectData(
            project, 
            index, 
            request.description
          );
          
          // Transformer les tâches IA en données de tâches
          const tasksData = this.aiTransformer.transformAITasksToTaskData(project.tasks || []);
          
          // Créer le projet avec ses tâches
          const result = await this.projectCreationService.createProjectWithTasks(projectData, tasksData);
          
          console.log(`✅ Projet ${result.project.id} créé avec ${result.tasks.length} tâches`);
          return result.project;
          
        } catch (error) {
          console.error(`❌ Erreur lors de la création du projet ${index + 1}:`, error);
          throw error;
        }
      });

    return new Observable(observer => {
      Promise.all(savePromises)
        .then(savedProjects => {
          console.log('✅ Tous les projets sauvés:', savedProjects.length);
          observer.next(savedProjects);
          observer.complete();
        })
        .catch(error => {
          console.error('❌ Erreur lors de la sauvegarde des projets:', error);
          observer.error(error);
        });
    });
  }

  generateTasksForProject(request: any): Observable<any[]> {
    console.log('Génération de tâches pour le projet:', request);
    
    return this.aiClient.generateProjects({
      description: request.description,
      projectId: request.projectId,
      taskGeneration: true
    }).pipe(
      switchMap((response: any) => {
        console.log('Réponse IA pour tâches:', response);
        
        // Le microservice retourne des projets avec des tâches, on extrait les tâches du premier projet
        if (response.projects && response.projects.length > 0 && response.projects[0].tasks) {
          const tasks = response.projects[0].tasks;
          console.log(`Sauvegarde de ${tasks.length} tâches pour le projet ${request.projectId}`);
          
          const taskPromises = tasks.map((task: any) => 
            this.http.post(`${this.apiUrl}/project-management`, {
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
            }, { headers: this.getAuthHeaders() }).toPromise()
          );

          return Promise.all(taskPromises).then((savedTasks: any[]) => {
            console.log(`${savedTasks.length} tâches sauvées`);
            return savedTasks;
          });
        }

        console.log('Aucune tâche trouvée dans la réponse IA');
        return Promise.resolve([]);
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

  private handleError(error: any): Observable<ChatbotResponse> {
    console.error('❌ Erreur microservice IA:', error);
    return of({
      success: false,
      message: 'Erreur du microservice IA',
      projects: [],
      analysis: {},
      suggestions: ['Microservice IA indisponible']
    });
  }

}
