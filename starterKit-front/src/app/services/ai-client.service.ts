import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, map, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AIClientService {
  private baseUrl = 'http://127.0.0.1:8000';
  
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  generateProjects(request: any): Observable<any> {
    console.log('Appel API FastAPI locale:', this.baseUrl + '/analyze');
    console.log('Données envoyées:', request);
    
    const analysisRequest = {
      description: request.description,
      additional_context: request.context || request.targetAudience,
      preferred_language: 'french',
      max_tasks: request.maxTasks || 5
    };
    
    console.log('Requête transformée pour FastAPI:', analysisRequest);
    
    return this.http.post<any>(
      `${this.baseUrl}/analyze`,
      analysisRequest,
      { 
        headers: this.getHeaders(),
        observe: 'response'
      }
    ).pipe(
      timeout(30000),
      map(response => {
        console.log('Réponse complète:', response);
        
        const analysisData = response.body;
        
        if (analysisData.success && analysisData.analysis) {
          return {
            success: true,
            message: "Analyse ML terminée avec succès",
            projects: [],
            analysis: analysisData.analysis,
            suggestions: ['Projet généré par IA']
          };
        }
        
        return {
          success: false,
          message: "Erreur dans l'analyse ML",
          projects: [],
          analysis: {},
          suggestions: ['Erreur d\'analyse']
        };
      }),
      catchError(error => {
        console.error('Erreur détaillée:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        
        return of({
          success: false,
          message: `Erreur ${error.status}: ${error.message}`,
          projects: [],
          analysis: {},
          suggestions: ['Erreur de connexion au microservice']
        });
      })
    );
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`).pipe(
      map(response => {
        console.log('Health check OK:', response);
        return response;
      }),
      catchError(error => {
        console.error('Health check failed:', error);
        return throwError(() => error);
      })
    );
  }
}