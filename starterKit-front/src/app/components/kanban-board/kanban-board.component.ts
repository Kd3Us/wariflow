import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ProjectService } from '../../services/project.service';
import { LoaderService } from '../../services/loader.service';
import { Project, ProjectStage } from '../../models/project.model';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { OnboardingComponent } from '../onboarding/onboarding.component';
import { LoaderComponent } from '../loader/loader.component';
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, ProjectCardComponent, ProjectFormComponent, OnboardingComponent, LoaderComponent, AddUserModalComponent],
  templateUrl: './kanban-board.component.html'
})

export class KanbanBoardComponent implements OnInit {
  ProjectStage = ProjectStage;
  ideeProjects: Project[] = [];
  mvpProjects: Project[] = [];
  tractionProjects: Project[] = [];
  leveeProjects: Project[] = [];
  
  selectedProject: Project | null = null;
  showProjectForm = false;
  isNewProject = true;
  isCreatingFirstProject = false;
  
  // Ajout pour la gestion des utilisateurs
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
  
  loadProjects(): void {
    this.projectService.getProjects().subscribe(projects => {
      this.ideeProjects = projects.filter(p => p.stage === ProjectStage.IDEE);
      this.mvpProjects = projects.filter(p => p.stage === ProjectStage.MVP);
      this.tractionProjects = projects.filter(p => p.stage === ProjectStage.TRACTION);
      this.leveeProjects = projects.filter(p => p.stage === ProjectStage.LEVEE);
    });
  }
  
  drop(event: CdkDragDrop<Project[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      // Update project stage
      const project = event.container.data[event.currentIndex];
      
      // Determine the new stage based on the container data
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
      
      // Update project stage locally
      project.stage = newStage;
      
      // Update project stage in backend and reload projects
      this.projectService.updateProjectStage(project.id, newStage).subscribe(() => {
        this.loadProjects();
      });
    }
  }

  creatingFirstProject() {
    this.isCreatingFirstProject = true;
    this.openProjectForm();
  }
  
  openProjectForm(stage: ProjectStage = ProjectStage.IDEE): void {
    this.isNewProject = true;
    this.selectedProject = null;
    this.showProjectForm = true;
  }
  
  editProject(project: Project): void {
    this.isNewProject = false;
    this.selectedProject = project;
    this.showProjectForm = true;
  }
  
  deleteProject(project: Project): void {
    this.projectService.deleteProject(project.id);
  }
  
  closeProjectForm(): void {
    this.showProjectForm = false;
    this.selectedProject = null;
  }
  
  saveProject(projectData: Partial<Project>): void {
    if (this.isNewProject) {
      this.projectService.addProject(projectData as Omit<Project, 'id' | 'createdAt'>);
    } else if (this.selectedProject) {
      this.projectService.updateProjectStage(this.selectedProject.id, projectData.stage!).subscribe(() => {
        this.loadProjects();
      });
    }
    this.closeProjectForm();
  }

  // Nouvelles méthodes pour la gestion des utilisateurs
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
          this.loadProjects(); // Recharger les projets pour voir les changements
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
        this.loadProjects(); // Recharger les projets pour voir les changements
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      }
    });
  }

  get selectedProjectTeamIds(): string[] {
    if (!this.selectedProjectId) return [];
    
    // Chercher le projet dans toutes les colonnes
    const allProjects = [...this.ideeProjects, ...this.mvpProjects, ...this.tractionProjects, ...this.leveeProjects];
    const project = allProjects.find(p => p.id === this.selectedProjectId);
    return project ? project.team.map(member => member.id) : [];
  }
}