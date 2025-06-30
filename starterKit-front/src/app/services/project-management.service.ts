import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProjectManagementTask, ProjectManagementStage } from '../models/project-management.model';
import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectManagementService {
  private apiUrl = `${environment.apiProjectManagementURL}`;
  private tasksSubject = new BehaviorSubject<ProjectManagementTask[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient,    private jwtService: JwtService,) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getTasks(): Observable<ProjectManagementTask[]> {
    return this.http.get<ProjectManagementTask[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getTasksByProject(projectId: string): Observable<ProjectManagementTask[]> {
    return this.http.get<ProjectManagementTask[]>(`${this.apiUrl}/project/${projectId}`, { headers: this.getAuthHeaders() });
  }

  createTask(task: Omit<ProjectManagementTask, 'id' | 'createdAt' | 'updatedAt'>): Observable<ProjectManagementTask> {
    return this.http.post<ProjectManagementTask>(this.apiUrl, task, { headers: this.getAuthHeaders() });
  }

  updateTask(id: string, task: Partial<ProjectManagementTask>): Observable<ProjectManagementTask> {
    return this.http.patch<ProjectManagementTask>(`${this.apiUrl}/${id}`, task, { headers: this.getAuthHeaders() });
  }

  updateTaskStage(id: string, stage: ProjectManagementStage): Observable<ProjectManagementTask> {
    return this.http.patch<ProjectManagementTask>(`${this.apiUrl}/${id}/stage`, { stage }, { headers: this.getAuthHeaders() });
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  assignUsersToTask(taskId: string, userIds: string[]): Observable<ProjectManagementTask> {
    return this.http.post<ProjectManagementTask>(`${this.apiUrl}/${taskId}/assign`, { userIds }, { headers: this.getAuthHeaders() });
  }

  removeUserFromTask(taskId: string, userId: string): Observable<ProjectManagementTask> {
    return this.http.delete<ProjectManagementTask>(`${this.apiUrl}/${taskId}/assign/${userId}`, { headers: this.getAuthHeaders() });
  }

  getTaskStatistics(projectId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/project/${projectId}/statistics`, { headers: this.getAuthHeaders() });
  }

  // Méthodes locales pour la gestion des tâches (simulation)
  private mockTasks: ProjectManagementTask[] = [];

  addTaskLocally(task: Omit<ProjectManagementTask, 'id' | 'createdAt' | 'updatedAt'>): void {
    const newTask: ProjectManagementTask = {
      ...task,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockTasks.push(newTask);
    this.tasksSubject.next([...this.mockTasks]);
  }

  updateTaskLocally(id: string, updates: Partial<ProjectManagementTask>): void {
    const index = this.mockTasks.findIndex(task => task.id === id);
    if (index !== -1) {
      this.mockTasks[index] = { ...this.mockTasks[index], ...updates, updatedAt: new Date() };
      this.tasksSubject.next([...this.mockTasks]);
    }
  }

  deleteTaskLocally(id: string): void {
    this.mockTasks = this.mockTasks.filter(task => task.id !== id);
    this.tasksSubject.next([...this.mockTasks]);
  }

  getTasksLocally(): ProjectManagementTask[] {
    return [...this.mockTasks];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
