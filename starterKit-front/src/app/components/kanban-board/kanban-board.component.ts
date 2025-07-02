import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectStage } from '../../models/project.model';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { ProjectFormComponent } from '../project-form/project-form.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, ProjectCardComponent, ProjectFormComponent],
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
  
  constructor(private projectService: ProjectService) {}
  
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
  }
  
  openProjectForm(): void {
    this.selectedProject = null;
    this.isNewProject = true;
    this.showProjectForm = true;
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
}