import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateCoachDto {
  name: string;
  email: string;
  avatar?: string;
  avatarBase64?: string;
  avatarMimeType?: string;
  specialties: string[];
  hourlyRate: number;
  bio: string;
  experience: number;
  certifications: string[];
  languages: string[];
  timezone: string;
  responseTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoachManagementService {
  private apiUrl = `${environment.apiCoachingURL}/coaches`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createCoach(coachData: CreateCoachDto): Observable<any> {
    return this.http.post(this.apiUrl, coachData, {
      headers: this.getHeaders()
    });
  }

  getAllCoaches(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }
}