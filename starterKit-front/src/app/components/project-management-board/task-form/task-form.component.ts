import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectManagementTask, ProjectManagementStage, TeamMember } from '../../../models/project-management.model';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ isNewTask ? 'Créer une nouvelle tâche' : 'Modifier la tâche' }}
            </h2>
            <button 
              (click)="onCancel()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <form (ngSubmit)="onSubmit()" #taskForm="ngForm">
            <!-- Titre -->
            <div class="mb-4">
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                Titre de la tâche *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                [(ngModel)]="formData.title"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez le titre de la tâche"
              >
            </div>

            <!-- Description -->
            <div class="mb-4">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                [(ngModel)]="formData.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez la tâche..."
              ></textarea>
            </div>

            <!-- Assignation des membres de l'équipe -->
            <div class="mb-4" *ngIf="selectedProject">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Assigner à l'équipe
              </label>
              <div class="text-xs text-gray-500 mb-3">
                Projet: {{ selectedProject.title }}
              </div>
              <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3" *ngIf="availableTeamMembers.length > 0">
                <div 
                  *ngFor="let member of availableTeamMembers" 
                  class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  (click)="onTeamMemberToggle(member.id)"
                >
                  <input
                    type="checkbox"
                    [checked]="isTeamMemberSelected(member.id)"
                    (change)="onTeamMemberToggle(member.id)"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  >
                  <div class="flex items-center space-x-2 flex-1">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {{ member.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-medium text-gray-900">{{ member.name }}</div>
                      <div class="text-xs text-gray-500">{{ member.role }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="availableTeamMembers.length === 0" class="text-sm text-gray-500 italic p-3 border border-gray-200 rounded-md">
                Aucun membre d'équipe disponible pour ce projet
              </div>
            </div>

            <!-- Message si aucun projet sélectionné -->
            <div class="mb-4" *ngIf="!selectedProject">
              <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div class="text-sm text-yellow-800">
                  Veuillez sélectionner un projet dans le tableau de bord pour créer une tâche.
                </div>
              </div>
            </div>

            <!-- Étape et Priorité -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label for="stage" class="block text-sm font-medium text-gray-700 mb-2">
                  Étape
                </label>
                <select
                  id="stage"
                  name="stage"
                  [(ngModel)]="formData.stage"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option [value]="ProjectManagementStage.PENDING">{{ ProjectManagementStage.PENDING }}</option>
                  <option [value]="ProjectManagementStage.INPROGRESS">{{ ProjectManagementStage.INPROGRESS }}</option>
                  <option [value]="ProjectManagementStage.TEST">{{ ProjectManagementStage.TEST }}</option>
                  <option [value]="ProjectManagementStage.DONE">{{ ProjectManagementStage.DONE }}</option>
                </select>
              </div>

              <div>
                <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  id="priority"
                  name="priority"
                  [(ngModel)]="formData.priority"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                </select>
              </div>
            </div>

            <!-- Progression et Deadline -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label for="progress" class="block text-sm font-medium text-gray-700 mb-2">
                  Progression (%)
                </label>
                <input
                  type="number"
                  id="progress"
                  name="progress"
                  [(ngModel)]="formData.progress"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
              </div>

              <div>
                <label for="deadline" class="block text-sm font-medium text-gray-700 mb-2">
                  Date limite
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  [(ngModel)]="formData.deadline"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
              </div>
            </div>

            <!-- Heures estimées et réelles -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label for="estimatedHours" class="block text-sm font-medium text-gray-700 mb-2">
                  Heures estimées
                </label>
                <input
                  type="number"
                  id="estimatedHours"
                  name="estimatedHours"
                  [(ngModel)]="formData.estimatedHours"
                  min="0"
                  step="0.5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
              </div>

              <div>
                <label for="actualHours" class="block text-sm font-medium text-gray-700 mb-2">
                  Heures réelles
                </label>
                <input
                  type="number"
                  id="actualHours"
                  name="actualHours"
                  [(ngModel)]="formData.actualHours"
                  min="0"
                  step="0.5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
              </div>
            </div>

            <!-- Tags -->
            <div class="mb-6">
              <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                [(ngModel)]="tagsString"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="frontend, urgent, bug..."
              >
            </div>

            <!-- Boutons d'action -->
            <div class="flex justify-end gap-3">
              <button
                type="button"
                (click)="onCancel()"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                [disabled]="!taskForm.form.valid"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {{ isNewTask ? 'Créer' : 'Modifier' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class TaskFormComponent implements OnInit {
  @Input() task: ProjectManagementTask | null = null;
  @Input() selectedProject: Project | null = null;
  @Output() save = new EventEmitter<Partial<ProjectManagementTask>>();
  @Output() cancel = new EventEmitter<void>();

  ProjectManagementStage = ProjectManagementStage;
  isNewTask = true;
  tagsString = '';
  availableTeamMembers: TeamMember[] = [];
  selectedTeamMemberIds: string[] = [];

  formData: Partial<ProjectManagementTask> = {
    title: '',
    description: '',
    stage: ProjectManagementStage.PENDING,
    progress: 0,
    priority: 'MEDIUM',
    projectId: '',
    tags: [],
    estimatedHours: 0,
    actualHours: 0,
    assignedTo: [],
    comments: 0,
    attachments: 0
  };

  constructor() {}

  ngOnInit(): void {
    // Charger les membres de l'équipe du projet sélectionné
    if (this.selectedProject) {
      this.availableTeamMembers = this.selectedProject.team || [];
      this.formData.projectId = this.selectedProject.id;
    }
    
    if (this.task) {
      this.isNewTask = false;
      this.formData = { ...this.task };
      this.tagsString = this.task.tags?.join(', ') || '';
      this.selectedTeamMemberIds = this.task.assignedTo?.map(member => member.id) || [];
      
      // Convertir la date pour l'input date
      if (this.task.deadline) {
        this.formData.deadline = new Date(this.task.deadline);
      }
    }
  }

  onTeamMemberToggle(memberId: string): void {
    const index = this.selectedTeamMemberIds.indexOf(memberId);
    if (index > -1) {
      this.selectedTeamMemberIds.splice(index, 1);
    } else {
      this.selectedTeamMemberIds.push(memberId);
    }
    
    // Mettre à jour formData.assignedTo
    this.formData.assignedTo = this.availableTeamMembers.filter(member => 
      this.selectedTeamMemberIds.includes(member.id)
    );
  }

  isTeamMemberSelected(memberId: string): boolean {
    return this.selectedTeamMemberIds.includes(memberId);
  }

  onSubmit(): void {
    // Traiter les tags
    this.formData.tags = this.tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // S'assurer que les membres assignés sont à jour
    this.formData.assignedTo = this.availableTeamMembers.filter(member => 
      this.selectedTeamMemberIds.includes(member.id)
    );

    this.save.emit(this.formData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
