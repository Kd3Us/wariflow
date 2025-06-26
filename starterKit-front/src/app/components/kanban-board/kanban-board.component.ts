import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProjectService } from '../../services/project.service';
import { LoaderService } from '../../services/loader.service';
import { ChatbotService, ChatbotResponse } from '../../services/chatbot.service';
import { Project, ProjectStage } from '../../models/project.model';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { AiProjectModalComponent } from '../ai-project-modal/ai-project-modal.component';
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule, 
    ReactiveFormsModule,
    ProjectCardComponent, 
    ProjectFormComponent, 
    AiProjectModalComponent,
    AddUserModalComponent
  ],
  template: `
    <ng-container *ngIf="(isLoading$ | async) === false; else loadingTemplate">
      <div class="kanban-container" *ngIf="hasProjects; else emptyState">
        <div class="kanban-header">
          <h1 class="text-2xl font-bold text-gray-800">Tableau de projet</h1>
          <div class="kanban-actions">
            <button class="btn-secondary" (click)="openProjectForm()">
              <span class="material-icons">add</span>
              Créer projet
            </button>
            <button class="btn-ai-primary" (click)="openAIProjectForm()">
              <span class="material-icons">auto_awesome</span>
              Générer par IA
            </button>
          </div>
        </div>

        <div class="kanban-board">
          <!-- Colonne IDEE -->
          <div class="kanban-column">
            <div class="column-header">
              <h2 class="column-title">{{ ProjectStage.IDEE }}</h2>
              <span class="project-count">{{ ideeProjects.length }}</span>
              <button class="add-project-btn" (click)="openProjectForm(ProjectStage.IDEE)">
                <span class="material-icons">add</span>
              </button>
            </div>
            
            <div
              cdkDropList
              #ideeList="cdkDropList"
              [cdkDropListData]="ideeProjects"
              [cdkDropListConnectedTo]="[mvpList, tractionList, leveeList]"
              class="projects-list"
              (cdkDropListDropped)="drop($event)"
            >
              <app-project-card
                *ngFor="let project of ideeProjects"
                [project]="project"
                cdkDrag
                [cdkDragData]="project"
                (edit)="editProject($event)"
                (delete)="deleteProject($event)"
                (addUsers)="onAddUsersClick($event)"
                (removeUser)="onRemoveUser($event)"
              ></app-project-card>
            </div>
          </div>

          <!-- Colonne MVP -->
          <div class="kanban-column">
            <div class="column-header">
              <h2 class="column-title">{{ ProjectStage.MVP }}</h2>
              <span class="project-count">{{ mvpProjects.length }}</span>
              <button class="add-project-btn" (click)="openProjectForm(ProjectStage.MVP)">
                <span class="material-icons">add</span>
              </button>
            </div>
            
            <div
              cdkDropList
              #mvpList="cdkDropList"
              [cdkDropListData]="mvpProjects"
              [cdkDropListConnectedTo]="[ideeList, tractionList, leveeList]"
              class="projects-list"
              (cdkDropListDropped)="drop($event)"
            >
              <app-project-card
                *ngFor="let project of mvpProjects"
                [project]="project"
                cdkDrag
                [cdkDragData]="project"
                (edit)="editProject($event)"
                (delete)="deleteProject($event)"
                (addUsers)="onAddUsersClick($event)"
                (removeUser)="onRemoveUser($event)"
              ></app-project-card>
            </div>
          </div>

          <!-- Colonne TRACTION -->
          <div class="kanban-column">
            <div class="column-header">
              <h2 class="column-title">{{ ProjectStage.TRACTION }}</h2>
              <span class="project-count">{{ tractionProjects.length }}</span>
              <button class="add-project-btn" (click)="openProjectForm(ProjectStage.TRACTION)">
                <span class="material-icons">add</span>
              </button>
            </div>
            
            <div
              cdkDropList
              #tractionList="cdkDropList"
              [cdkDropListData]="tractionProjects"
              [cdkDropListConnectedTo]="[ideeList, mvpList, leveeList]"
              class="projects-list"
              (cdkDropListDropped)="drop($event)"
            >
              <app-project-card
                *ngFor="let project of tractionProjects"
                [project]="project"
                cdkDrag
                [cdkDragData]="project"
                (edit)="editProject($event)"
                (delete)="deleteProject($event)"
                (addUsers)="onAddUsersClick($event)"
                (removeUser)="onRemoveUser($event)"
              ></app-project-card>
            </div>
          </div>

          <!-- Colonne LEVEE -->
          <div class="kanban-column">
            <div class="column-header">
              <h2 class="column-title">{{ ProjectStage.LEVEE }}</h2>
              <span class="project-count">{{ leveeProjects.length }}</span>
              <button class="add-project-btn" (click)="openProjectForm(ProjectStage.LEVEE)">
                <span class="material-icons">add</span>
              </button>
            </div>
            
            <div
              cdkDropList
              #leveeList="cdkDropList"
              [cdkDropListData]="leveeProjects"
              [cdkDropListConnectedTo]="[ideeList, mvpList, tractionList]"
              class="projects-list"
              (cdkDropListDropped)="drop($event)"
            >
              <app-project-card
                *ngFor="let project of leveeProjects"
                [project]="project"
                cdkDrag
                [cdkDragData]="project"
                (edit)="editProject($event)"
                (delete)="deleteProject($event)"
                (addUsers)="onAddUsersClick($event)"
                (removeUser)="onRemoveUser($event)"
              ></app-project-card>
            </div>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <ng-template #emptyState>
        <div class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">📋</div>
            <h2>Aucun projet pour le moment</h2>
            <p>Commencez par créer votre premier projet ou utilisez l'IA pour en générer automatiquement.</p>
            <div class="empty-actions">
              <button class="btn-primary" (click)="openProjectForm()">
                <span class="material-icons">add</span>
                Créer un projet
              </button>
              <button class="btn-ai-primary" (click)="openAIProjectForm()">
                <span class="material-icons">auto_awesome</span>
                Générer avec l'IA
              </button>
            </div>
          </div>
        </div>
      </ng-template>
    </ng-container>

    <!-- Template de chargement -->
    <ng-template #loadingTemplate>
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Chargement des projets...</p>
      </div>
    </ng-template>

    <!-- Modals -->
    <app-project-form
      *ngIf="showProjectForm"
      [project]="selectedProject"
      (save)="saveProject($event)"
      (cancel)="closeProjectForm()"
    ></app-project-form>

    <app-ai-project-modal
      [isOpen]="showAiProjectModal"
      (close)="closeAIProjectModal()"
      (projectsGenerated)="onProjectsGenerated($event)"
    ></app-ai-project-modal>

    <app-add-user-modal
      [isOpen]="isAddUserModalOpen"
      [currentTeamIds]="selectedProjectTeamIds"
      (close)="onCloseAddUserModal()"
      (userAdded)="onUsersAdded($event)"
    ></app-add-user-modal>
  `,
  styles: [`
    .kanban-container {
      @apply h-full flex flex-col;
    }

    .kanban-header {
      @apply flex justify-between items-center p-6 bg-white border-b border-gray-200;
    }

    .kanban-actions {
      @apply flex gap-3;
    }

    .btn-primary {
      @apply px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2;
    }

    .btn-secondary {
      @apply px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors flex items-center gap-2;
    }

    .btn-ai-primary {
      @apply px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-md font-medium hover:from-purple-600 hover:to-blue-600 transition-all flex items-center gap-2 shadow-lg;
    }

    .kanban-board {
      @apply flex-1 flex gap-6 p-6 overflow-x-auto min-h-0;
    }

    .kanban-column {
      @apply flex-1 min-w-[300px] max-w-[350px] bg-gray-50 rounded-lg p-4 flex flex-col h-full;
    }

    .column-header {
      @apply flex items-center mb-4;
    }

    .column-title {
      @apply text-base font-semibold text-gray-700 m-0;
    }

    .project-count {
      @apply ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600;
    }

    .add-project-btn {
      @apply ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer transition-colors hover:bg-blue-500 hover:text-white;
    }

    .projects-list {
      @apply flex-grow overflow-y-auto min-h-[100px] p-1;
    }

    .empty-state {
      @apply h-full flex items-center justify-center p-8;
    }

    .empty-content {
      @apply text-center max-w-md;
    }

    .empty-icon {
      @apply text-6xl mb-4;
    }

    .empty-content h2 {
      @apply text-xl font-semibold text-gray-800 mb-2;
    }

    .empty-content p {
      @apply text-gray-600 mb-6;
    }

    .empty-actions {
      @apply flex justify-center gap-4;
    }

    .loading-container {
      @apply h-full flex flex-col items-center justify-center;
    }

    .loading-spinner {
      @apply w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4;
    }

    .loading-container p {
      @apply text-gray-600;
    }
  `]
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
  
  isAddUserModalOpen = false;
  selectedProjectId: string | null = null;
  
  isLoading$: Observable<boolean>;

  constructor(
    private projectService: ProjectService,
    private loaderService: LoaderService,
    private chatbotService: ChatbotService,
    private fb: FormBuilder
  ) {
    this.isLoading$ = this.loaderService.isLoading$;
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  get hasProjects(): boolean {
    return this.ideeProjects.length > 0 || 
           this.mvpProjects.length > 0 || 
           this.tractionProjects.length > 0 || 
           this.leveeProjects.length > 0;
  }

  private loadProjects(): void {
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
    console.log('🚀 Ouverture modal IA');
    this.showAiProjectModal = true;
  }

  closeAIProjectModal(): void {
    this.showAiProjectModal = false;
  }

  onProjectsGenerated(result: ChatbotResponse): void {
    console.log('🔄 Projets générés par IA - Mise à jour immédiate');
    
    // Fermer le modal
    this.closeAIProjectModal();
    
    // Si on a des projets dans le résultat, les ajouter directement
    if (result && result.projects) {
      console.log('📥 Ajout direct de', result.projects.length, 'projets');
      
      result.projects.forEach(project => {
        // Convertir les dates si nécessaire
        const formattedProject = {
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
          deadline: new Date(project.deadline),
          reminderDate: project.reminderDate ? new Date(project.reminderDate) : undefined
        };
        
        // Ajouter directement dans la bonne liste selon le stage
        switch (formattedProject.stage) {
          case ProjectStage.IDEE:
            this.ideeProjects.push(formattedProject);
            break;
          case ProjectStage.MVP:
            this.mvpProjects.push(formattedProject);
            break;
          case ProjectStage.TRACTION:
            this.tractionProjects.push(formattedProject);
            break;
          case ProjectStage.LEVEE:
            this.leveeProjects.push(formattedProject);
            break;
        }
        
        console.log('✅ Projet ajouté:', formattedProject.title, 'dans', formattedProject.stage);
      });
      
      console.log('🎉 Mise à jour terminée - Projets visibles immédiatement');
    } else {
      console.log('⚠️ Pas de projets dans le résultat, rechargement classique');
      this.loadProjects();
    }
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