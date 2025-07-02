import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Project, ProjectStage } from '../models/project.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiProjectURL}/projects`;
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  projects$ = this.projectsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.http.get<Project[]>(this.apiUrl)
      .pipe(
        map(projects => projects.map(project => ({
          ...project,
          deadline: project.deadline ? new Date(project.deadline) : undefined,
          reminderDate: project.reminderDate ? new Date(project.reminderDate) : undefined,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        })))
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
    const createProjectData = {
      title: project.title,
      description: project.description,
      stage: project.stage,
      progress: project.progress || 0,
      deadline: project.deadline instanceof Date ? project.deadline.toISOString() : project.deadline,
      teamIds: project.teamIds || [],
      priority: project.priority || 'MEDIUM',
      tags: project.tags || [],
      reminderDate: project.reminderDate instanceof Date ? project.reminderDate.toISOString() : project.reminderDate,
      instructions: project.instructions || []
    };

    console.log('Données envoyées au backend:', createProjectData);
    console.log('Instructions à sauvegarder:', createProjectData.instructions);

    this.http.post<Project>(this.apiUrl, createProjectData)
      .pipe(
        map(newProject => ({
          ...newProject,
          deadline: newProject.deadline ? new Date(newProject.deadline) : undefined,
          reminderDate: newProject.reminderDate ? new Date(newProject.reminderDate) : undefined,
          createdAt: new Date(newProject.createdAt),
          updatedAt: new Date(newProject.updatedAt)
        })),
        tap(newProject => {
          console.log('Projet créé avec instructions:', newProject.instructions);
          const currentProjects = this.projectsSubject.value;
          this.projectsSubject.next([...currentProjects, newProject]);
        })
      )
      .subscribe({
        next: (newProject) => {
          console.log('Projet créé avec succès:', newProject);
          console.log('Nombre d\'instructions sauvegardées:', newProject.instructions?.length || 0);
        },
        error: (error) => {
          console.error('Erreur lors de la création du projet:', error);
        }
      });
  }

  updateProject(project: Project): void {
    const updateData = {
      title: project.title,
      description: project.description,
      stage: project.stage,
      progress: project.progress || 0,
      deadline: project.deadline instanceof Date ? project.deadline.toISOString() : project.deadline,
      teamIds: project.team?.map(member => member.id) || [],
      priority: project.priority || 'MEDIUM',
      tags: project.tags || [],
      reminderDate: project.reminderDate instanceof Date ? project.reminderDate.toISOString() : project.reminderDate,
      instructions: project.instructions || []
    };

    console.log('Données de mise à jour envoyées:', updateData);
    console.log('Instructions à mettre à jour:', updateData.instructions);

    this.http.put<Project>(`${this.apiUrl}/${project.id}`, updateData)
      .pipe(
        map(updatedProject => ({
          ...updatedProject,
          deadline: updatedProject.deadline ? new Date(updatedProject.deadline) : undefined,
          reminderDate: updatedProject.reminderDate ? new Date(updatedProject.reminderDate) : undefined,
          createdAt: new Date(updatedProject.createdAt),
          updatedAt: new Date(updatedProject.updatedAt)
        })),
        tap(updatedProject => {
          console.log('Projet mis à jour reçu:', updatedProject);
          console.log('Instructions après mise à jour:', updatedProject.instructions);
          const currentProjects = this.projectsSubject.value;
          const index = currentProjects.findIndex(p => p.id === updatedProject.id);
          if (index !== -1) {
            currentProjects[index] = updatedProject;
            this.projectsSubject.next([...currentProjects]);
          }
        })
      )
      .subscribe({
        next: (updatedProject) => {
          console.log('Projet mis à jour avec succès:', updatedProject.title);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du projet:', error);
        }
      });
  }

  updateProjectStage(projectId: string, stage: ProjectStage): Observable<Project> {
    const currentProjects = this.projectsSubject.value;
    const project = currentProjects.find(p => p.id === projectId);
    if (project) {
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

      return this.http.put<Project>(`${this.apiUrl}/${projectId}`, updateData)
        .pipe(
          map(updatedProject => ({
            ...updatedProject,
            deadline: updatedProject.deadline ? new Date(updatedProject.deadline) : undefined,
            reminderDate: updatedProject.reminderDate ? new Date(updatedProject.reminderDate) : undefined,
            createdAt: new Date(updatedProject.createdAt),
            updatedAt: new Date(updatedProject.updatedAt)
          })),
          tap(updatedProject => {
            const index = currentProjects.findIndex(p => p.id === updatedProject.id);
            if (index !== -1) {
              currentProjects[index] = updatedProject;
              this.projectsSubject.next([...currentProjects]);
            }
          })
        );
    } else {
      throw new Error('Project not found');
    }
  }

  addUsersToProject(projectId: string, userIds: string[]): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/${projectId}/users`, { userIds })
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
        })
      );
  }

  removeUserFromProject(projectId: string, userId: string): Observable<Project> {
    return this.http.delete<Project>(`${this.apiUrl}/${projectId}/users/${userId}`)
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
        })
      );
  }

  deleteProject(projectId: string): void {
    this.http.delete(`${this.apiUrl}/${projectId}`)
      .pipe(
        tap(() => {
          const currentProjects = this.projectsSubject.value;
          const filteredProjects = currentProjects.filter(p => p.id !== projectId);
          this.projectsSubject.next(filteredProjects);
        })
      )
      .subscribe();
  }
}