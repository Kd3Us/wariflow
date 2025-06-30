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
export class ProjectsService {
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

  getProjectsByStage(): Observable<Record<ProjectStage, Project[]>> {
    return this.projects$.pipe(
      map(projects => ({
        [ProjectStage.IDEE]: projects.filter(p => p.stage === ProjectStage.IDEE),
        [ProjectStage.MVP]: projects.filter(p => p.stage === ProjectStage.MVP),
        [ProjectStage.TRACTION]: projects.filter(p => p.stage === ProjectStage.TRACTION),
        [ProjectStage.LEVEE]: projects.filter(p => p.stage === ProjectStage.LEVEE)
      }))
    );
  }

  createProject(project: any): Observable<Project> {
    this.loaderService.startLoading();
    return this.http.post<Project>(this.apiUrl, project, { headers: this.getAuthHeaders() })
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
      );
  }

  updateProject(id: string, project: any): Observable<Project> {
    this.loaderService.startLoading();
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project, { headers: this.getAuthHeaders() })
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
          const index = currentProjects.findIndex(p => p.id === id);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        }),
        finalize(() => this.loaderService.stopLoading())
      );
  }

  updateProjectStage(projectId: string, stage: ProjectStage): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${projectId}/stage`, { stage }, { headers: this.getAuthHeaders() })
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
          const index = currentProjects.findIndex(p => p.id === projectId);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        })
      );
  }

  deleteProject(id: string): Observable<void> {
    this.loaderService.startLoading();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          const currentProjects = this.projectsSubject.value;
          const filteredProjects = currentProjects.filter(p => p.id !== id);
          this.projectsSubject.next(filteredProjects);
        }),
        finalize(() => this.loaderService.stopLoading())
      );
  }

  addUsersToProject(projectId: string, userIds: string[]): Observable<Project> {
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
          const index = currentProjects.findIndex(p => p.id === projectId);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        })
      );
  }

  removeUserFromProject(projectId: string, userId: string): Observable<Project> {
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
          const index = currentProjects.findIndex(p => p.id === projectId);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        })
      );
  }

  toggleSubStepCompletion(projectId: string, subStepId: string): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${projectId}/substeps/${subStepId}/toggle`, {}, { headers: this.getAuthHeaders() })
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
          const index = currentProjects.findIndex(p => p.id === projectId);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        })
      );
  }

  addSubStep(projectId: string, subStepData: { title: string; description?: string }): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/${projectId}/substeps`, subStepData, { headers: this.getAuthHeaders() })
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
          const index = currentProjects.findIndex(p => p.id === projectId);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        })
      );
  }

  updateSubStep(projectId: string, subStepId: string, updateData: any): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${projectId}/substeps/${subStepId}`, updateData, { headers: this.getAuthHeaders() })
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
          const index = currentProjects.findIndex(p => p.id === projectId);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        })
      );
  }

  deleteSubStep(projectId: string, subStepId: string): Observable<Project> {
    return this.http.delete<Project>(`${this.apiUrl}/${projectId}/substeps/${subStepId}`, { headers: this.getAuthHeaders() })
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
          const index = currentProjects.findIndex(p => p.id === projectId);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        })
      );
  }

  refreshProjects(): void {
    this.loadProjects();
  }
}