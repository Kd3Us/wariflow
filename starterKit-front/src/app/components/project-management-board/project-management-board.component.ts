import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ProjectManagementService } from '../../services/project-management.service';
import { ProjectsService } from '../../services/project.service';
import { LoaderService } from '../../services/loader.service';
import { ProjectManagementTask, ProjectManagementStage } from '../../models/project-management.model';
import { Project } from '../../models/project.model';
// import { TaskCardComponent } from '../task-card/task-card.component';
// import { TaskFormComponent } from '../task-form/task-form.component';
import { LoaderComponent } from '../loader/loader.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-project-management-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, LoaderComponent],
  template: `
    <div class="project-management-container">
      <app-loader></app-loader>
      
      <div class="header mb-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-800">Gestion de Projet</h1>
          
          <div class="flex items-center gap-4">
            <div class="project-selector">
              <label for="project-select" class="block text-sm font-medium text-gray-700 mb-1">
                Projet sélectionné
              </label>
              <select 
                id="project-select"
                [(ngModel)]="selectedProjectId" 
                (ngModelChange)="onProjectChange($event)"
                class="form-select block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un projet</option>
                <option *ngFor="let project of projects" [value]="project.id">
                  {{ project.title }}
                </option>
              </select>
            </div>
            
            <button
              *ngIf="selectedProjectId"
              (click)="openTaskForm()"
              class="btn-primary flex items-center gap-2 px-4 py-2 rounded-md"
            >
              <span class="material-icons text-sm">add</span>
              Nouvelle tâche
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="!selectedProjectId" class="text-center py-12">
        <div class="text-gray-500">
          <span class="material-icons text-4xl mb-4 block">assignment</span>
          <p class="text-lg">Sélectionnez un projet pour voir ses tâches</p>
        </div>
      </div>

      <div *ngIf="selectedProjectId" class="kanban-board">
        <div class="flex gap-6 overflow-x-auto pb-4 h-full">
          
          <div class="kanban-column">
            <div class="kanban-header">
              <h2 class="kanban-title">À faire</h2>
              <span class="task-count">{{ pendingTasks.length }}</span>
            </div>
            <div 
              cdkDropList 
              #pendingList="cdkDropList"
              [cdkDropListData]="pendingTasks"
              [cdkDropListConnectedTo]="[inProgressList, testList, doneList]"
              class="kanban-list"
              (cdkDropListDropped)="drop($event)"
            >
              <div
                *ngFor="let task of pendingTasks"
                cdkDrag
                [cdkDragData]="task"
                class="task-card p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer"
              >
                <h3 class="font-semibold text-gray-800 mb-2">{{ task.title }}</h3>
                <p class="text-sm text-gray-600 mb-2">{{ task.description }}</p>
                <div class="flex justify-between items-center">
                  <span class="text-xs px-2 py-1 rounded" 
                        [ngClass]="{'bg-green-100 text-green-800': task.priority === 'HIGH',
                                   'bg-yellow-100 text-yellow-800': task.priority === 'MEDIUM',
                                   'bg-gray-100 text-gray-800': task.priority === 'LOW'}">
                    {{ task.priority }}
                  </span>
                  <div class="flex gap-1">
                    <button (click)="editTask(task)" class="text-blue-600 text-sm">✏️</button>
                    <button (click)="deleteTask(task)" class="text-red-600 text-sm">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="kanban-column">
            <div class="kanban-header">
              <h2 class="kanban-title">En cours</h2>
              <span class="task-count">{{ inProgressTasks.length }}</span>
            </div>
            <div 
              cdkDropList 
              #inProgressList="cdkDropList"
              [cdkDropListData]="inProgressTasks"
              [cdkDropListConnectedTo]="[pendingList, testList, doneList]"
              class="kanban-list"
              (cdkDropListDropped)="drop($event)"
            >
              <div
                *ngFor="let task of inProgressTasks"
                cdkDrag
                [cdkDragData]="task"
                class="task-card p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer"
              >
                <h3 class="font-semibold text-gray-800 mb-2">{{ task.title }}</h3>
                <p class="text-sm text-gray-600 mb-2">{{ task.description }}</p>
                <div class="flex justify-between items-center">
                  <span class="text-xs px-2 py-1 rounded" 
                        [ngClass]="{'bg-green-100 text-green-800': task.priority === 'HIGH',
                                   'bg-yellow-100 text-yellow-800': task.priority === 'MEDIUM',
                                   'bg-gray-100 text-gray-800': task.priority === 'LOW'}">
                    {{ task.priority }}
                  </span>
                  <div class="flex gap-1">
                    <button (click)="editTask(task)" class="text-blue-600 text-sm">✏️</button>
                    <button (click)="deleteTask(task)" class="text-red-600 text-sm">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="kanban-column">
            <div class="kanban-header">
              <h2 class="kanban-title">Test</h2>
              <span class="task-count">{{ testTasks.length }}</span>
            </div>
            <div 
              cdkDropList 
              #testList="cdkDropList"
              [cdkDropListData]="testTasks"
              [cdkDropListConnectedTo]="[pendingList, inProgressList, doneList]"
              class="kanban-list"
              (cdkDropListDropped)="drop($event)"
            >
              <div
                *ngFor="let task of testTasks"
                cdkDrag
                [cdkDragData]="task"
                class="task-card p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer"
              >
                <h3 class="font-semibold text-gray-800 mb-2">{{ task.title }}</h3>
                <p class="text-sm text-gray-600 mb-2">{{ task.description }}</p>
                <div class="flex justify-between items-center">
                  <span class="text-xs px-2 py-1 rounded" 
                        [ngClass]="{'bg-green-100 text-green-800': task.priority === 'HIGH',
                                   'bg-yellow-100 text-yellow-800': task.priority === 'MEDIUM',
                                   'bg-gray-100 text-gray-800': task.priority === 'LOW'}">
                    {{ task.priority }}
                  </span>
                  <div class="flex gap-1">
                    <button (click)="editTask(task)" class="text-blue-600 text-sm">✏️</button>
                    <button (click)="deleteTask(task)" class="text-red-600 text-sm">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="kanban-column">
            <div class="kanban-header">
              <h2 class="kanban-title">Terminé</h2>
              <span class="task-count">{{ doneTasks.length }}</span>
            </div>
            <div 
              cdkDropList 
              #doneList="cdkDropList"
              [cdkDropListData]="doneTasks"
              [cdkDropListConnectedTo]="[pendingList, inProgressList, testList]"
              class="kanban-list"
              (cdkDropListDropped)="drop($event)"
            >
              <div
                *ngFor="let task of doneTasks"
                cdkDrag
                [cdkDragData]="task"
                class="task-card p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer"
              >
                <h3 class="font-semibold text-gray-800 mb-2">{{ task.title }}</h3>
                <p class="text-sm text-gray-600 mb-2">{{ task.description }}</p>
                <div class="flex justify-between items-center">
                  <span class="text-xs px-2 py-1 rounded" 
                        [ngClass]="{'bg-green-100 text-green-800': task.priority === 'HIGH',
                                   'bg-yellow-100 text-yellow-800': task.priority === 'MEDIUM',
                                   'bg-gray-100 text-gray-800': task.priority === 'LOW'}">
                    {{ task.priority }}
                  </span>
                  <div class="flex gap-1">
                    <button (click)="editTask(task)" class="text-blue-600 text-sm">✏️</button>
                    <button (click)="deleteTask(task)" class="text-red-600 text-sm">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal simplifié pour les tâches -->
    <div *ngIf="showTaskForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg w-96">
        <h3 class="text-lg font-semibold mb-4">{{ isNewTask ? 'Nouvelle tâche' : 'Modifier la tâche' }}</h3>
        <form (ngSubmit)="saveTask({ title: taskTitle.value, description: taskDescription.value })" #taskForm="ngForm">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input #taskTitle type="text" [value]="selectedTask?.title || ''" required
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea #taskDescription [value]="selectedTask?.description || ''" rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" (click)="closeTaskForm()" 
                    class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {{ isNewTask ? 'Créer' : 'Modifier' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProjectManagementBoardComponent implements OnInit {
  ProjectManagementStage = ProjectManagementStage;
  
  pendingTasks: ProjectManagementTask[] = [];
  inProgressTasks: ProjectManagementTask[] = [];
  testTasks: ProjectManagementTask[] = [];
  doneTasks: ProjectManagementTask[] = [];
  
  selectedTask: ProjectManagementTask | null = null;
  showTaskForm = false;
  isNewTask = true;
  
  projects: Project[] = [];
  selectedProjectId: string = '';
  selectedProject: Project | null = null;

  selectedTaskId: string | null = null;
  
  isLoading$: Observable<boolean>;
  
  constructor(
    private projectManagementService: ProjectManagementService,
    private projectService: ProjectsService,
    private loaderService: LoaderService
  ) {
    this.isLoading$ = this.loaderService.isLoading$;
  }
  
  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
    
    this.projectManagementService.tasks$.subscribe(tasks => {
      this.organizeTasks(tasks);
    });
  }
  
  loadTasks(): void {
    if (this.selectedProjectId) {
      this.projectManagementService.getTasksByProject(this.selectedProjectId).subscribe((tasks: ProjectManagementTask[]) => {
        this.organizeTasks(tasks);
      });
    }
  }
  
  loadProjects(): void {
    this.projectService.getProjects().subscribe((projects: Project[]) => {
      this.projects = projects;
    });
  }

  onProjectChange(projectId: string): void {
    this.selectedProject = this.projects.find(p => p.id === projectId) || null;
    
    if (projectId) {
      this.projectManagementService.getTasksByProject(projectId).subscribe((tasks: ProjectManagementTask[]) => {
        this.organizeTasks(tasks);
      });
    } else {
      this.organizeTasks([]);
    }
  }

  organizeTasks(tasks: ProjectManagementTask[]): void {
    const filteredTasks = this.selectedProjectId ? 
      tasks.filter(task => task.projectId === this.selectedProjectId) : 
      tasks;

    this.pendingTasks = filteredTasks.filter(task => task.stage === ProjectManagementStage.PENDING);
    this.inProgressTasks = filteredTasks.filter(task => task.stage === ProjectManagementStage.INPROGRESS);
    this.testTasks = filteredTasks.filter(task => task.stage === ProjectManagementStage.TEST);
    this.doneTasks = filteredTasks.filter(task => task.stage === ProjectManagementStage.DONE);
  }
  
  drop(event: CdkDragDrop<ProjectManagementTask[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      const task = event.container.data[event.currentIndex];
      
      let newStage: ProjectManagementStage;
      if (event.container.data === this.pendingTasks) {
        newStage = ProjectManagementStage.PENDING;
      } else if (event.container.data === this.inProgressTasks) {
        newStage = ProjectManagementStage.INPROGRESS;
      } else if (event.container.data === this.testTasks) {
        newStage = ProjectManagementStage.TEST;
      } else if (event.container.data === this.doneTasks) {
        newStage = ProjectManagementStage.DONE;
      } else {
        return;
      }
      
      this.projectManagementService.updateTaskStage(task.id, newStage).subscribe({
        next: (updatedTask: ProjectManagementTask) => {
          const index = event.container.data.findIndex(t => t.id === updatedTask.id);
          if (index !== -1) {
            event.container.data[index] = updatedTask;
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
  
  openTaskForm(): void {
    this.selectedTask = null;
    this.isNewTask = true;
    this.showTaskForm = true;
  }
  
  editTask(task: ProjectManagementTask): void {
    this.selectedTask = task;
    this.isNewTask = false;
    this.showTaskForm = true;
  }
  
  deleteTask(task: ProjectManagementTask): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task.title}" ?`)) {
      this.projectManagementService.deleteTask(task.id).subscribe(() => {
        this.loadTasks();
      });
    }
  }
  
  saveTask(taskData: Partial<ProjectManagementTask>): void {
    if (!this.selectedProjectId) {
      return;
    }

    if (this.isNewTask) {
      const newTask = {
        ...taskData,
        projectId: this.selectedProjectId,
        stage: ProjectManagementStage.PENDING
      } as Omit<ProjectManagementTask, 'id' | 'createdAt' | 'updatedAt'>;
      
      this.projectManagementService.createTask(newTask).subscribe(() => {
        this.loadTasks();
      });
    } else if (this.selectedTask) {
      const updatedTask = { ...this.selectedTask, ...taskData };
      this.projectManagementService.updateTask(this.selectedTask.id, taskData).subscribe(() => {
        this.loadTasks();
      });
    }
    this.closeTaskForm();
  }
  
  closeTaskForm(): void {
    this.showTaskForm = false;
    this.selectedTask = null;
  }
}