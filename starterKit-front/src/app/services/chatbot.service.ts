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
    console.log('🤖 Appel du microservice IA:', request);
    
    return this.aiClient.generateProjects({
      description: request.description,
      context: request.context,
      targetAudience: request.targetAudience,
      includeAnalysis: true
    }).pipe(
      switchMap(response => {
        console.log('🎯 STRUCTURE COMPLÈTE de la réponse IA:', JSON.stringify(response, null, 2));
        console.log('🔍 response.projects:', response.projects);
        console.log('🔍 Premier projet:', response.projects?.[0]);
        console.log('🔍 Tasks du premier projet:', response.projects?.[0]?.tasks);
        
        if (response.projects && response.projects.length > 0) {
          console.log('💾 Sauvegarde des projets en base locale...');
          
          const savePromises = response.projects.map(async (project: any, index: number) => {
            const savedProject: any = await this.http.post(`${this.apiUrl}/projects`, {
              title: project.name || project.title || `Projet IA ${index + 1} - ${request.description.substring(0, 30)}`,
              description: project.description || request.description,
              stage: ProjectStage.IDEE,
              progress: 0,
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              teamIds: [],
              priority: 'MEDIUM',
              tags: []
            }, { headers: this.getAuthHeaders() }).toPromise();

            if (project.tasks && project.tasks.length > 0 && savedProject) {
              console.log(`💾 Sauvegarde de ${project.tasks.length} tâches pour le projet ${savedProject.id}`);
              
              const taskPromises = project.tasks.map((task: any) => 
                this.http.post(`${this.apiUrl}/project-management`, {
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
                }, { headers: this.getAuthHeaders() }).toPromise()
              );

              await Promise.all(taskPromises);
              console.log(`✅ ${project.tasks.length} tâches sauvées pour le projet ${savedProject.id}`);
            }

            return savedProject;
          });

          return Promise.all(savePromises).then(savedProjects => {
            console.log('✅ Projets sauvés en local:', savedProjects.length);
            return {
              success: true,
              message: `${savedProjects.length} projets générés et sauvés avec leurs tâches !`,
              projects: savedProjects,
              analysis: response.analysis || {},
              suggestions: response.suggestions || []
            };
          }).catch(saveError => {
            console.error('❌ Erreur sauvegarde:', saveError);
            return {
              success: true,
              message: 'Projets générés mais erreur lors de la sauvegarde',
              projects: response.projects || [],
              analysis: response.analysis || {},
              suggestions: response.suggestions || ['Erreur de sauvegarde locale']
            };
          });
        }

        return of({
          success: true,
          message: 'Projets générés via le microservice IA !',
          projects: response.projects || [],
          analysis: response.analysis || {},
          suggestions: response.suggestions || []
        });
      }),
      catchError(error => {
        console.error('❌ Erreur microservice IA:', error);
        return of({
          success: false,
          message: 'Erreur du microservice IA',
          projects: [],
          analysis: {},
          suggestions: ['Microservice IA indisponible']
        });
      })
    );
  }

  testConnection(): Observable<boolean> {
    return this.aiClient.checkHealth().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}