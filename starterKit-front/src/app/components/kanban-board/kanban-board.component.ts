import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { AiProjectModalComponent } from '../ai-project-modal/ai-project-modal.component';
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { OnboardingComponent } from '../onboarding/onboarding.component';
import { LoaderComponent } from '../loader/loader.component';
import { Project, ProjectStage } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { LoaderService } from '../../services/loader.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule, 
    ProjectCardComponent, 
    ProjectFormComponent,
    AiProjectModalComponent,
    AddUserModalComponent,
    OnboardingComponent,
    LoaderComponent
  ],
  templateUrl: './kanban-board.component.html',
})
export class KanbanBoardComponent implements OnInit {
  ProjectStage = ProjectStage;
  
  ideeProjects: Project[] = [];
  mvpProjects: Project[] = [];
  tractionProjects: Project[] = [];
  leveeProjects: Project[] = [];
  
  showProjectForm = false;
  showAiProjectModal = false;
  selectedProject: Project | null = null;
  isNewProject = false;
  isCreatingFirstProject = false;
  
  isAddUserModalOpen = false;
  selectedProjectId: string | null = null;
  
  isLoading$: Observable<boolean>;

  constructor(
    private projectService: ProjectService,
    private loaderService: LoaderService
  ) {
    this.isLoading$ = this.loaderService.isLoading$;
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.projectService.getProjects().subscribe(projects => {
      this.ideeProjects = projects.filter(p => p.stage === ProjectStage.IDEE);
      this.mvpProjects = projects.filter(p => p.stage === ProjectStage.MVP);
      this.tractionProjects = projects.filter(p => p.stage === ProjectStage.TRACTION);
      this.leveeProjects = projects.filter(p => p.stage === ProjectStage.LEVEE);
    });
  }

  creatingFirstProject(): void {
    this.isCreatingFirstProject = true;
    this.openProjectForm();
  }

  drop(event: CdkDragDrop<Project[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const project = event.container.data[event.currentIndex];
    
    let newStage: ProjectStage;
    if (event.container.data === this.ideeProjects) {
      newStage = ProjectStage.IDEE;
    } else if (event.container.data === this.mvpProjects) {
      newStage = ProjectStage.MVP;
    } else if (event.container.data === this.tractionProjects) {
      newStage = ProjectStage.TRACTION;
    } else if (event.container.data === this.leveeProjects) {
      newStage = ProjectStage.LEVEE;
    } else {
      return;
    }
    
    this.projectService.updateProjectStage(project.id, newStage).subscribe({
      next: (updatedProject) => {
        const index = event.container.data.findIndex(p => p.id === updatedProject.id);
        if (index !== -1) {
          event.container.data[index] = updatedProject;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de l\'étape:', error);
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex,
        );
      }
    });
  }

  openProjectForm(initialStage?: ProjectStage): void {
    this.selectedProject = null;
    this.isNewProject = true;
    this.showProjectForm = true;
  }

  openAIProjectForm(): void {
    this.showAiProjectModal = true;
  }

  closeAIProjectModal(): void {
    this.showAiProjectModal = false;
  }

  onProjectsGenerated(): void {
    this.loadProjects();
    this.closeAIProjectModal();
  }

  editProject(project: Project): void {
    this.selectedProject = project;
    this.isNewProject = false;
    this.showProjectForm = true;
  }

  deleteProject(project: Project): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
      this.projectService.deleteProject(project.id);
      this.loadProjects();
    }
  }

  saveProject(projectData: Partial<Project>): void {
    if (this.isNewProject) {
      this.projectService.addProject(projectData as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>);
    } else if (this.selectedProject) {
      const updatedProject = { ...this.selectedProject, ...projectData };
      this.projectService.updateProject(updatedProject);
    }
    this.closeProjectForm();
    setTimeout(() => this.loadProjects(), 100);
  }

  closeProjectForm(): void {
    this.showProjectForm = false;
    this.selectedProject = null;
  }

  onAddUsersClick(projectId: string): void {
    this.selectedProjectId = projectId;
    this.isAddUserModalOpen = true;
  }

  onCloseAddUserModal(): void {
    this.isAddUserModalOpen = false;
    this.selectedProjectId = null;
  }

  onUsersAdded(userIds: string[]): void {
    if (this.selectedProjectId) {
      this.projectService.addUsersToProject(this.selectedProjectId, userIds).subscribe({
        next: () => {
          this.loadProjects();
          this.onCloseAddUserModal();
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'ajout d\'utilisateurs:', error);
        }
      });
    }
  }

  onRemoveUser(data: { projectId: string, userId: string }): void {
    this.projectService.removeUserFromProject(data.projectId, data.userId).subscribe({
      next: () => {
        this.loadProjects();
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      }
    });
  }

  get selectedProjectTeamIds(): string[] {
    if (!this.selectedProjectId) return [];
    
    const allProjects = [...this.ideeProjects, ...this.mvpProjects, ...this.tractionProjects, ...this.leveeProjects];
    const project = allProjects.find(p => p.id === this.selectedProjectId);
    return project ? project.team.map(member => member.id) : [];
  }
}