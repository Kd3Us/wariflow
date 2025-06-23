import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, finalize } from 'rxjs';
import { Project, ProjectStage } from '../models/project.model';
import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';
import { LoaderService } from './loader.service';


@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = environment.apiProjectURL;
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  projects$ = this.projectsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private jwtService: JwtService,
    private loaderService: LoaderService
  ) {
    this.loadProjects();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private loadProjects(): void {
    this.loaderService.startLoading();
    this.http.get<Project[]>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(
        map(projects => projects.map(project => ({
          ...project,
          deadline: project.deadline ? new Date(project.deadline) : undefined,
          reminderDate: project.reminderDate ? new Date(project.reminderDate) : undefined,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }))),
        finalize(() => this.loaderService.stopLoading())
      )
      .subscribe(projects => this.projectsSubject.next(projects));
  }

  getProjects(): Observable<Project[]> {
    return this.projects$;
  }

  getProject(id: string): Observable<Project | undefined> {
    return this.projects$.pipe(
      map(projects => projects.find(p => p.id === id))
    );
  }

  addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.loaderService.startLoading();
    this.http.post<Project>(this.apiUrl, project, { headers: this.getAuthHeaders() })
      .pipe(
        map(newProject => ({
          ...newProject,
          deadline: newProject.deadline ? new Date(newProject.deadline) : undefined,
          reminderDate: newProject.reminderDate ? new Date(newProject.reminderDate) : undefined,
          createdAt: new Date(newProject.createdAt),
          updatedAt: new Date(newProject.updatedAt)
        })),
        tap(newProject => {
          const currentProjects = this.projectsSubject.value;
          this.projectsSubject.next([...currentProjects, newProject]);
        }),
        finalize(() => this.loaderService.stopLoading())
      )
      .subscribe();
  }

  updateProject(project: Project): void {
    this.loaderService.startLoading();
    this.http.put<Project>(`${this.apiUrl}/${project.id}`, project, { headers: this.getAuthHeaders() })
      .pipe(
        map(updatedProject => ({
          ...updatedProject,
          deadline: updatedProject.deadline ? new Date(updatedProject.deadline) : undefined,
          reminderDate: updatedProject.reminderDate ? new Date(updatedProject.reminderDate) : undefined,
          createdAt: new Date(updatedProject.createdAt),
          updatedAt: new Date(updatedProject.updatedAt)
        })),
        tap(updatedProject => {
          const currentProjects = this.projectsSubject.value;
          const index = currentProjects.findIndex(p => p.id === updatedProject.id);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        }),
        finalize(() => this.loaderService.stopLoading())
      )
      .subscribe();
  }

  updateProjectStage(projectId: string, stage: ProjectStage): Observable<Project> {
    const currentProjects = this.projectsSubject.value;
    const project = currentProjects.find(p => p.id === projectId);
    if (project) {
      this.loaderService.startLoading();
      const updateData = {
        title: project.title,
        description: project.description,
        stage: stage,
        progress: project.progress || 0,
        deadline: project.deadline?.toISOString(),
        teamIds: project.team.map(member => member.id),
        priority: project.priority,
        tags: project.tags || [],
        reminderDate: project.reminderDate?.toISOString()
      };

      return this.http.put<Project>(`${this.apiUrl}/${projectId}`, updateData, { headers: this.getAuthHeaders() })
        .pipe(
          map(updatedProject => ({
            ...updatedProject,
            deadline: updatedProject.deadline ? new Date(updatedProject.deadline) : undefined,
            reminderDate: updatedProject.reminderDate ? new Date(updatedProject.reminderDate) : undefined
          })),
          tap(updatedProject => {
            const currentProjects = this.projectsSubject.value;
            const index = currentProjects.findIndex(p => p.id === updatedProject.id);
            if (index !== -1) {
              currentProjects[index] = updatedProject;
              this.projectsSubject.next([...currentProjects]);
            }
          }),
          finalize(() => this.loaderService.stopLoading())
        );
    }
    return new Observable<Project>();
  }

  deleteProject(id: string): void {
    this.loaderService.startLoading();
    this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          const currentProjects = this.projectsSubject.value;
          this.projectsSubject.next(currentProjects.filter(p => p.id !== id));
        }),
        finalize(() => this.loaderService.stopLoading())
      )
      .subscribe();
  }

  getProjectsByStage(stage: ProjectStage): Observable<Project[]> {
    return this.projects$.pipe(
      map(projects => projects.filter(project => project.stage === stage))
    );
  }

  // Ajouter ces méthodes à la fin de ton ProjectService

  addUsersToProject(projectId: string, userIds: string[]): Observable<Project> {
    this.loaderService.startLoading();
    return this.http.post<Project>(`${this.apiUrl}/${projectId}/users`, { userIds }, { headers: this.getAuthHeaders() })
      .pipe(
        map(updatedProject => ({
          ...updatedProject,
          deadline: updatedProject.deadline ? new Date(updatedProject.deadline) : undefined,
          reminderDate: updatedProject.reminderDate ? new Date(updatedProject.reminderDate) : undefined,
          createdAt: new Date(updatedProject.createdAt),
          updatedAt: new Date(updatedProject.updatedAt)
        })),
        tap(updatedProject => {
          const currentProjects = this.projectsSubject.value;
          const index = currentProjects.findIndex(p => p.id === updatedProject.id);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        }),
        finalize(() => this.loaderService.stopLoading())
      );
  }

  removeUserFromProject(projectId: string, userId: string): Observable<Project> {
    this.loaderService.startLoading();
    return this.http.delete<Project>(`${this.apiUrl}/${projectId}/users/${userId}`, { headers: this.getAuthHeaders() })
      .pipe(
        map(updatedProject => ({
          ...updatedProject,
          deadline: updatedProject.deadline ? new Date(updatedProject.deadline) : undefined,
          reminderDate: updatedProject.reminderDate ? new Date(updatedProject.reminderDate) : undefined,
          createdAt: new Date(updatedProject.createdAt),
          updatedAt: new Date(updatedProject.updatedAt)
        })),
        tap(updatedProject => {
          const currentProjects = this.projectsSubject.value;
          const index = currentProjects.findIndex(p => p.id === updatedProject.id);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        }),
        finalize(() => this.loaderService.stopLoading())
      );
  }
}
