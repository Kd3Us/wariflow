import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, GenerateProjectRequest, ChatbotResponse } from '../../services/chatbot.service';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { ProjectManagementTask } from '../../models/project-management.model';

@Component({
  selector: 'app-ai-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-project-modal.component.html'
})
export class AiProjectModalComponent implements OnInit {
  @Input() projects: Project[] = [];
  @Input() selectedProjectId: string = '';
  @Input() mode: 'project-creation' | 'task-creation' = 'project-creation';
  @Output() close = new EventEmitter<void>();
  @Output() projectsGenerated = new EventEmitter<ChatbotResponse>();
  @Output() tasksGenerated = new EventEmitter<ProjectManagementTask[]>();

  generationType: 'new-project' | 'add-tasks' = 'new-project';
  maxTasks = 5;

  request: GenerateProjectRequest = {
    description: '',
    context: '',
    targetAudience: '',
    maxTasks: 5
  };

  isLoading = false;
  error: string | null = null;
  lastResult: ChatbotResponse | null = null;

  constructor(
    private chatbotService: ChatbotService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    
    if (this.mode === 'task-creation' && this.selectedProjectId) {
      this.generationType = 'add-tasks';
    } else {
      this.generationType = 'new-project';
    }
  }

  private loadProjects(): void {
    if (this.projects.length === 0) {
      this.projectService.getProjects().subscribe(projects => {
        this.projects = projects;
        console.log('Projets chargés dans la modale:', this.projects.length);
      });
    }
  }

  onSubmit(): void {
    this.request.maxTasks = this.maxTasks;
    
    if (this.generationType === 'add-tasks') {
      this.generateTasksForProject();
    } else {
      this.generateNewProject();
    }
  }

  onMaxTasksChange(): void {
    this.request.maxTasks = this.maxTasks;
  }

  private generateNewProject(): void {
    if (this.request.description.length < 20) {
      this.error = 'La description doit contenir au moins 20 caractères';
      return;
    }

    if (this.maxTasks < 3 || this.maxTasks > 15) {
      this.error = 'Le nombre de tâches doit être entre 1 et 25';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.lastResult = null;

    console.log('Génération de projets IA démarrée avec', this.maxTasks, 'tâches');

    this.chatbotService.generateProject(this.request).subscribe({
      next: (result) => {
        console.log('Projets générés avec succès:', result);
        this.isLoading = false;
        this.lastResult = result;
        
        setTimeout(() => {
          this.projectsGenerated.emit(result);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Erreur lors de la génération:', error);
        this.isLoading = false;
        this.error = error.error?.message || 'Une erreur est survenue lors de la génération';
      }
    });
  }

  private generateTasksForProject(): void {
    if (this.request.description.length < 20) {
      this.error = 'La description doit contenir au moins 20 caractères';
      return;
    }

    if (!this.selectedProjectId) {
      this.error = 'Veuillez sélectionner un projet';
      return;
    }

    if (this.maxTasks < 3 || this.maxTasks > 15) {
      this.error = 'Le nombre de tâches doit être entre 1 et 25';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.lastResult = null;

    console.log('Génération de tâches IA démarrée avec', this.maxTasks, 'tâches');

    const request = {
      description: this.request.description,
      context: this.request.context,
      targetAudience: this.request.targetAudience,
      projectId: this.selectedProjectId,
      maxTasks: this.maxTasks
    };

    this.chatbotService.generateTasksForProject(request).subscribe({
      next: (tasks: any[]) => {
        console.log('Tâches générées avec succès:', tasks);
        this.isLoading = false;
        this.lastResult = {
          success: true,
          message: `${tasks.length} tâche(s) générée(s) avec succès !`,
          projects: [],
          analysis: {},
          suggestions: []
        };
        
        setTimeout(() => {
          this.tasksGenerated.emit(tasks);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Erreur lors de la génération des tâches:', error);
        this.isLoading = false;
        this.error = error.error?.message || 'Une erreur est survenue lors de la génération des tâches';
      }
    });
  }
  onCancel(): void {
    this.close.emit();
  }

  getSelectedProjectName(): string {
    if (!this.selectedProjectId || !this.projects) return '';
    const project = this.projects.find(p => p.id === this.selectedProjectId);
    return project ? project.title : '';
  }
}