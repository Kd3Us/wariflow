import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTeamMemberDto {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface UpdateTeamMemberDto {
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private apiUrl = environment.apiTeamsURL;

  constructor(
    private http: HttpClient,
    private jwtService: JwtService,
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllTeamMembers(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getTeamMember(id: string): Observable<TeamMember> {
    return this.http.get<TeamMember>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
