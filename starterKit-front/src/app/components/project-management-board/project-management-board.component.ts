import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ProjectManagementService } from '../../services/project-management.service';
import { LoaderService } from '../../services/loader.service';
import { ProjectService } from '../../services/project.service';
import { ProjectManagementTask, ProjectManagementStage } from '../../models/project-management.model';
import { Project } from '../../models/project.model';
import { TaskCardComponent } from './task-card/task-card.component';
import { TaskFormComponent } from './task-form/task-form.component';
import { AiProjectModalComponent } from '../ai-project-modal/ai-project-modal.component';
import { LoaderComponent } from '../loader/loader.component';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ChatbotResponse } from '../../services/chatbot.service';

@Component({
  selector: 'app-project-management-board',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule, 
    TaskCardComponent, 
    TaskFormComponent, 
    AiProjectModalComponent,
    LoaderComponent,
    FormsModule
  ],
  template: `
    <!-- Loader -->
    <app-loader *ngIf="isLoading$ | async"></app-loader>

    <div class="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-semibold text-gray-800">Gestion de Projet</h1>
        <div class="flex gap-2">
          <button
            (click)="openAIProjectForm()"
            class="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md font-medium cursor-pointer transition-colors hover:bg-purple-700"
          >
            <span class="material-icons text-lg">auto_awesome</span>
            Générer avec IA
          </button>
          <button
            (click)="openTaskForm()"
            class="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-light"
            [disabled]="!selectedProjectId"
          >
            <span class="material-icons text-lg">add</span>
            Créer tâche
          </button>
        </div>
      </div>

      <!-- Sélecteur de projet -->
      <div class="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center gap-4">
          <label for="projectSelect" class="text-sm font-medium text-gray-700 whitespace-nowrap">
            Projet actuel :
          </label>
          <select
            id="projectSelect"
            [(ngModel)]="selectedProjectId"
            (ngModelChange)="onProjectChange($event)"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionnez un projet</option>
            <option *ngFor="let project of projects" [value]="project.id">
              {{ project.title }}
            </option>
          </select>
          
          <div *ngIf="selectedProject" class="flex items-center gap-2 text-sm text-gray-600">
            <span class="px-2 py-1 bg-gray-100 rounded-md">{{ selectedProject.stage }}</span>
            <span>{{ selectedProject.team.length }} membre(s)</span>
          </div>
        </div>
        
        <div *ngIf="!selectedProjectId" class="mt-3 text-sm text-gray-500">
          Veuillez sélectionner un projet pour voir et gérer ses tâches.
        </div>
      </div>

      <div class="flex gap-5 overflow-x-auto pb-4 h-full">
        <!-- PENDING Column -->
        <div class="flex-1 min-w-[300px] max-w-[350px] bg-gray-50 rounded-lg p-4 flex flex-col h-full">
          <div class="flex items-center mb-4">
            <h2 class="text-base font-semibold text-gray-700 m-0">{{ ProjectManagementStage.PENDING }}</h2>
            <span class="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">{{ pendingTasks.length }}</span>
            <button
              (click)="openTaskForm(ProjectManagementStage.PENDING)"
              class="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer transition-colors hover:bg-secondary hover:text-white"
            >
              <span class="material-icons text-lg">add</span>
            </button>
          </div>

          <div
            cdkDropList
            #pendingList="cdkDropList"
            [cdkDropListData]="pendingTasks"
            [cdkDropListConnectedTo]="[inProgressList, testList, doneList]"
            class="flex-grow overflow-y-auto min-h-[100px] p-1"
            (cdkDropListDropped)="drop($event)"
          >
            <app-task-card
              *ngFor="let task of pendingTasks"
              [task]="task"
              cdkDrag
              [cdkDragData]="task"
              class="mb-4"
              (edit)="editTask($event)"
              (delete)="deleteTask($event)"
              (removeUser)="onRemoveUser($event)"
            ></app-task-card>
          </div>
        </div>

        <!-- INPROGRESS Column -->
        <div class="flex-1 min-w-[300px] max-w-[350px] bg-gray-50 rounded-lg p-4 flex flex-col h-full">
          <div class="flex items-center mb-4">
            <h2 class="text-base font-semibold text-gray-700 m-0">{{ ProjectManagementStage.INPROGRESS }}</h2>
            <span class="ml-2 px-2 py-0.5 bg-blue-200 rounded-full text-xs text-blue-800">{{ inProgressTasks.length }}</span>
            <button
              (click)="openTaskForm(ProjectManagementStage.INPROGRESS)"
              class="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer transition-colors hover:bg-secondary hover:text-white"
            >
              <span class="material-icons text-lg">add</span>
            </button>
          </div>

          <div
            cdkDropList
            #inProgressList="cdkDropList"
            [cdkDropListData]="inProgressTasks"
            [cdkDropListConnectedTo]="[pendingList, testList, doneList]"
            class="flex-grow overflow-y-auto min-h-[100px] p-1"
            (cdkDropListDropped)="drop($event)"
          >
            <app-task-card
              *ngFor="let task of inProgressTasks"
              [task]="task"
              cdkDrag
              [cdkDragData]="task"
              class="mb-4"
              (edit)="editTask($event)"
              (delete)="deleteTask($event)"
              (removeUser)="onRemoveUser($event)"
            ></app-task-card>
          </div>
        </div>

        <!-- TEST Column -->
        <div class="flex-1 min-w-[300px] max-w-[350px] bg-gray-50 rounded-lg p-4 flex flex-col h-full">
          <div class="flex items-center mb-4">
            <h2 class="text-base font-semibold text-gray-700 m-0">{{ ProjectManagementStage.TEST }}</h2>
            <span class="ml-2 px-2 py-0.5 bg-yellow-200 rounded-full text-xs text-yellow-800">{{ testTasks.length }}</span>
            <button
              (click)="openTaskForm(ProjectManagementStage.TEST)"
              class="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer transition-colors hover:bg-secondary hover:text-white"
            >
              <span class="material-icons text-lg">add</span>
            </button>
          </div>

          <div
            cdkDropList
            #testList="cdkDropList"
            [cdkDropListData]="testTasks"
            [cdkDropListConnectedTo]="[pendingList, inProgressList, doneList]"
            class="flex-grow overflow-y-auto min-h-[100px] p-1"
            (cdkDropListDropped)="drop($event)"
          >
            <app-task-card
              *ngFor="let task of testTasks"
              [task]="task"
              cdkDrag
              [cdkDragData]="task"
              class="mb-4"
              (edit)="editTask($event)"
              (delete)="deleteTask($event)"
              (removeUser)="onRemoveUser($event)"
            ></app-task-card>
          </div>
        </div>

        <!-- DONE Column -->
        <div class="flex-1 min-w-[300px] max-w-[350px] bg-gray-50 rounded-lg p-4 flex flex-col h-full">
          <div class="flex items-center mb-4">
            <h2 class="text-base font-semibold text-gray-700 m-0">{{ ProjectManagementStage.DONE }}</h2>
            <span class="ml-2 px-2 py-0.5 bg-green-200 rounded-full text-xs text-green-800">{{ doneTasks.length }}</span>
            <button
              (click)="openTaskForm(ProjectManagementStage.DONE)"
              class="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer transition-colors hover:bg-secondary hover:text-white"
            >
              <span class="material-icons text-lg">add</span>
            </button>
          </div>

          <div
            cdkDropList
            #doneList="cdkDropList"
            [cdkDropListData]="doneTasks"
            [cdkDropListConnectedTo]="[pendingList, inProgressList, testList]"
            class="flex-grow overflow-y-auto min-h-[100px] p-1"
            (cdkDropListDropped)="drop($event)"
          >
            <app-task-card
              *ngFor="let task of doneTasks"
              [task]="task"
              cdkDrag
              [cdkDragData]="task"
              class="mb-4"
              (edit)="editTask($event)"
              (delete)="deleteTask($event)"
              (removeUser)="onRemoveUser($event)"
            ></app-task-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Form Modal -->
    <app-task-form
      *ngIf="showTaskForm"
      [task]="selectedTask"
      [selectedProject]="selectedProject"
      (save)="saveTask($event)"
      (cancel)="closeTaskForm()"
    ></app-task-form>

    <!-- AI Project Modal -->
    <app-ai-project-modal
      *ngIf="showAiProjectModal"
      [projects]="projects"
      (close)="closeAIProjectModal()"
      (projectsGenerated)="onProjectsGenerated($event)"
      (tasksGenerated)="onTasksGenerated($event)"
    ></app-ai-project-modal>
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
  showAiProjectModal = false;
  isNewTask = true;
  
  projects: Project[] = [];
  selectedProjectId: string = '';
  selectedProject: Project | null = null;

  selectedTaskId: string | null = null;
  
  isLoading$: Observable<boolean>;
  
  constructor(
    private projectManagementService: ProjectManagementService,
    private projectService: ProjectService,
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
      this.projectManagementService.getTasksByProject(this.selectedProjectId).subscribe(tasks => {
        this.organizeTasks(tasks);
      });
    }
  }
  
  loadProjects(): void {
    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
    });
  }

  onProjectChange(projectId: string): void {
    this.selectedProject = this.projects.find(p => p.id === projectId) || null;
    
    if (projectId) {
      this.projectManagementService.getTasksByProject(projectId).subscribe(tasks => {
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

    this.pendingTasks = filteredTasks.filter(t => t.stage === ProjectManagementStage.PENDING);
    this.inProgressTasks = filteredTasks.filter(t => t.stage === ProjectManagementStage.INPROGRESS);
    this.testTasks = filteredTasks.filter(t => t.stage === ProjectManagementStage.TEST);
    this.doneTasks = filteredTasks.filter(t => t.stage === ProjectManagementStage.DONE);
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
      
      task.stage = newStage;
      
      if (newStage === ProjectManagementStage.DONE) {
        task.progress = 100;
      }
      
      this.projectManagementService.updateTaskStage(task.id, newStage).subscribe(() => {
        this.loadTasks();
      });
    }
  }

  openTaskForm(stage: ProjectManagementStage = ProjectManagementStage.PENDING): void {
    this.isNewTask = true;
    this.selectedTask = null;
    this.showTaskForm = true;
  }

  openAIProjectForm(): void {
    console.log('Ouverture modal IA');
    this.showAiProjectModal = true;
  }

  closeAIProjectModal(): void {
    this.showAiProjectModal = false;
  }

  onProjectsGenerated(result: ChatbotResponse): void {
    console.log('Projets générés par IA - Rechargement des projets');
    this.closeAIProjectModal();
    
    if (result && result.projects && result.projects.length > 0) {
      this.projects = [...this.projects, ...result.projects];
      alert(`${result.projects.length} projet(s) créé(s) avec succès ! Vous pouvez maintenant les sélectionner pour créer des tâches.`);
    }
  }

  onTasksGenerated(tasks: any[]): void {
    console.log('Tâches générées par IA:', tasks);
    this.closeAIProjectModal();
    
    if (tasks && tasks.length > 0) {
      this.loadTasks();
      alert(`${tasks.length} tâche(s) générée(s) avec succès pour le projet sélectionné !`);
    }
  }
  
  editTask(task: ProjectManagementTask): void {
    this.isNewTask = false;
    this.selectedTask = task;
    this.showTaskForm = true;
  }
  
  deleteTask(task: ProjectManagementTask): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      this.projectManagementService.deleteTask(task.id).subscribe(() => {
        this.loadTasks();
      });
    }
  }
  
  closeTaskForm(): void {
    this.showTaskForm = false;
    this.selectedTask = null;
  }
  
  saveTask(taskData: Partial<ProjectManagementTask>): void {
    if (this.isNewTask) {
      const newTaskData = {
        ...taskData,
        projectId: this.selectedProjectId
      };
      this.projectManagementService.createTask(newTaskData as Omit<ProjectManagementTask, 'id' | 'createdAt' | 'updatedAt'>).subscribe(() => {
        this.loadTasks();
        this.closeTaskForm();
      });
    } else if (this.selectedTask) {
      const tmp = taskData as any;
      delete taskData.createdAt;
      delete taskData.updatedAt;
      delete taskData.id;
      delete tmp.project;
      this.projectManagementService.updateTask(this.selectedTask.id, taskData as ProjectManagementTask).subscribe(() => {
        this.loadTasks();
        this.closeTaskForm();
      });
    }
  }

  onRemoveUser(data: { taskId: string, userId: string }): void {
    console.log('Removing user', data.userId, 'from task', data.taskId);
  }

  get selectedTaskAssignedIds(): string[] {
    if (!this.selectedTaskId) return [];
    
    const allTasks = [...this.pendingTasks, ...this.inProgressTasks, ...this.testTasks, ...this.doneTasks];
    const task = allTasks.find(t => t.id === this.selectedTaskId);
    return task ? task.assignedTo.map(member => member.id) : [];
  }
}