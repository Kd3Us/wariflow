import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtService } from './jwt.service';

export interface GenerateProjectRequest {
  description: string;
  context?: string;
  targetAudience?: string;
}

export interface ProjectTask {
  title: string;
  description: string;
  stage: string;
  estimatedDays: number;
}

export interface ProjectAnalysis {
  projectType: string;
  complexity: 'simple' | 'moyen' | 'complexe';
  keywords: string[];
  estimatedDuration: number;
  suggestedTags: string[];
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH';
  breakdown: ProjectTask[];
}

export interface ChatbotResponse {
  success: boolean;
  message: string;
  projects: any[];
  analysis: ProjectAnalysis;
  suggestions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = 'http://localhost:3009/chatbot';

  constructor(
    private http: HttpClient,
    private jwtService: JwtService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  generateProject(request: GenerateProjectRequest): Observable<ChatbotResponse> {
    console.log('Appel API pour génération de projet:', request);
    console.log('URL API:', `${this.apiUrl}/generate-project`);
    
    return this.http.post<ChatbotResponse>(
      `${this.apiUrl}/generate-project`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  analyzeProject(request: GenerateProjectRequest): Observable<ProjectAnalysis> {
    console.log('Appel API pour analyse de projet:', request);
    
    return this.http.post<ProjectAnalysis>(
      `${this.apiUrl}/analyze-only`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test`);
  }
}