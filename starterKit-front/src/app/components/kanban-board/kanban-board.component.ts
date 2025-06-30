import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ProjectsService } from '../../services/project.service';
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
  
  isAddUserModalOpen = false;
  selectedProjectId: string | null = null;
  
  isLoading$: Observable<boolean>;
  
  constructor(
    private projectService: ProjectsService,
    private loaderService: LoaderService
  ) {
    this.isLoading$ = this.loaderService.isLoading$;
  }
  
  ngOnInit(): void {
    this.loadProjects();
  }
  
  loadProjects(): void {
    this.projectService.getProjects().subscribe((projects: Project[]) => {
      this.ideeProjects = projects.filter((p: Project) => p.stage === ProjectStage.IDEE);
      this.mvpProjects = projects.filter((p: Project) => p.stage === ProjectStage.MVP);
      this.tractionProjects = projects.filter((p: Project) => p.stage === ProjectStage.TRACTION);
      this.leveeProjects = projects.filter((p: Project) => p.stage === ProjectStage.LEVEE);
    });
  }

  onProjectUpdated(updatedProject: Project): void {
    const updateInList = (list: Project[]) => {
      const index = list.findIndex(p => p.id === updatedProject.id);
      if (index !== -1) {
        list[index] = updatedProject;
      }
    };

    updateInList(this.ideeProjects);
    updateInList(this.mvpProjects);
    updateInList(this.tractionProjects);
    updateInList(this.leveeProjects);
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
        next: (updatedProject: Project) => {
          const index = event.container.data.findIndex(p => p.id === updatedProject.id);
          if (index !== -1) {
            event.container.data[index] = updatedProject;
          }
        },
        error: (error: any) => {
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
      this.projectService.deleteProject(project.id);
      this.loadProjects();
    }
  }
  
  closeProjectForm(): void {
    this.showProjectForm = false;
    this.selectedProject = null;
  }
  
  saveProject(projectData: Partial<Project>): void {
    if (this.isNewProject) {
      this.projectService.createProject(projectData).subscribe(() => {
        this.loadProjects();
      });
    } else if (this.selectedProject) {
      this.projectService.updateProject(this.selectedProject.id, projectData).subscribe(() => {
        this.loadProjects();
      });
    }
    this.closeProjectForm();
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