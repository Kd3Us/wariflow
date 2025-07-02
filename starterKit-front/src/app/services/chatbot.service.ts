import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from './ai-client.service';

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
  constructor(private aiClient: AIClientService) {}

  generateProject(request: GenerateProjectRequest): Observable<ChatbotResponse> {
    console.log('🤖 Appel du microservice IA:', request);
    
    return this.aiClient.generateProjects({
      description: request.description,
      context: request.context,
      targetAudience: request.targetAudience,
      includeAnalysis: true
    }).pipe(
      map(response => ({
        success: true,
        message: 'Projets générés via le microservice IA !',
        projects: response.projects || [],
        analysis: response.analysis || {},
        suggestions: response.suggestions || []
      })),
      catchError(error => {
        console.error('❌ Erreur microservice:', error);
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