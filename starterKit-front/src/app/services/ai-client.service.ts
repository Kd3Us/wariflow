import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, map, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AIClientService {
  private baseUrl = 'https://api.speedpresta.com/api';
  private apiKey = 'MonCleFortePourSeeuriser2024!';
  
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    });
  }

  generateProjects(request: any): Observable<any> {
    console.log('Appel API microservice:', this.baseUrl + '/generate-projects');
    console.log('Données envoyées:', request);
    
    return this.http.post<any>(
      `${this.baseUrl}/generate-projects`,
      request,
      { 
        headers: this.getHeaders(),
        observe: 'response'
      }
    ).pipe(
      timeout(30000),
      map(response => {
        console.log('Réponse complète:', response);
        return response.body;
      }),
      catchError(error => {
        console.error('Erreur détaillée:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        
        return of({
          success: false,
          message: `Erreur ${error.status}: ${error.message}`,
          projects: [],
          suggestions: ['Erreur de connexion au microservice']
        });
      })
    );
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl.replace('/api', '')}/health`).pipe(
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