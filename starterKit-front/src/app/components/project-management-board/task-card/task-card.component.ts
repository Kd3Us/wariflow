import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectManagementTask } from '../../../models/project-management.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
      <!-- Header avec titre et priorité -->
      <div class="flex justify-between items-start mb-3">
        <h3 class="font-medium text-gray-900 text-sm line-clamp-2 flex-1 mr-2">{{ task.title }}</h3>
        <span 
          class="px-2 py-1 text-xs font-medium rounded-full flex-shrink-0"
          [ngClass]="{
            'bg-red-100 text-red-800': task.priority === 'HIGH',
            'bg-yellow-100 text-yellow-800': task.priority === 'MEDIUM',
            'bg-green-100 text-green-800': task.priority === 'LOW'
          }"
        >
          {{ task.priority }}
        </span>
      </div>

      <!-- Description -->
      <p class="text-gray-600 text-xs mb-3 line-clamp-2" *ngIf="task.description">
        {{ task.description }}
      </p>

      <!-- Barre de progression -->
      <div class="mb-3" *ngIf="task.progress > 0">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-gray-500">Progression</span>
          <span class="text-xs text-gray-700 font-medium">{{ task.progress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-500 h-2 rounded-full transition-all duration-300"
            [style.width.%]="task.progress"
          ></div>
        </div>
      </div>

      <!-- Informations sur les heures -->
      <div class="flex justify-between text-xs text-gray-500 mb-3" *ngIf="task.estimatedHours || task.actualHours">
        <span *ngIf="task.estimatedHours">Est: {{ task.estimatedHours }}h</span>
        <span *ngIf="task.actualHours">Act: {{ task.actualHours }}h</span>
      </div>

      <!-- Tags -->
      <div class="flex flex-wrap gap-1 mb-3" *ngIf="task.tags && task.tags.length > 0">
        <span 
          *ngFor="let tag of task.tags.slice(0, 3)" 
          class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
        >
          {{ tag }}
        </span>
        <span 
          *ngIf="task.tags.length > 3" 
          class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
        >
          +{{ task.tags.length - 3 }}
        </span>
      </div>

      <!-- Footer avec assignés et actions -->
      <div class="flex justify-between items-center">
        <!-- Membres assignés -->
        <div class="flex -space-x-2" *ngIf="task.assignedTo && task.assignedTo.length > 0">
          <div 
            *ngFor="let member of task.assignedTo.slice(0, 3)" 
            class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
            [title]="member.name"
          >
            {{ member?.name?.charAt(0)?.toUpperCase()}}
          </div>
          <div 
            *ngIf="task.assignedTo.length > 3"
            class="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
          >
            +{{ task.assignedTo.length - 3 }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <!-- Deadline -->
          <span 
            *ngIf="task.deadline" 
            class="text-xs text-gray-500 flex items-center gap-1"
            [ngClass]="{
              'text-red-500': isOverdue(task.deadline),
              'text-yellow-500': isDueSoon(task.deadline)
            }"
          >
            <span class="material-icons text-sm">schedule</span>
            {{ formatDate(task.deadline) }}
          </span>

          <!-- Commentaires et pièces jointes -->
          <div class="flex items-center gap-2 text-gray-400">
            <span *ngIf="task.comments > 0" class="flex items-center gap-1 text-xs">
              <span class="material-icons text-sm">comment</span>
              {{ task.comments }}
            </span>
            <span *ngIf="task.attachments > 0" class="flex items-center gap-1 text-xs">
              <span class="material-icons text-sm">attach_file</span>
              {{ task.attachments }}
            </span>
          </div>

          <!-- Menu actions -->
          <div class="relative">
            <button 
              (click)="toggleMenu($event)"
              class="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <span class="material-icons text-sm text-gray-400">more_vert</span>
            </button>
            
            <div 
              *ngIf="showMenu" 
              class="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]"
            >
              <button 
                (click)="onEdit()"
                class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <span class="material-icons text-sm">edit</span>
                Modifier
              </button>
              <button 
                (click)="onDelete()"
                class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <span class="material-icons text-sm">delete</span>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class TaskCardComponent {
  @Input() task!: ProjectManagementTask;
  @Output() edit = new EventEmitter<ProjectManagementTask>();
  @Output() delete = new EventEmitter<ProjectManagementTask>();
  @Output() removeUser = new EventEmitter<{taskId: string, userId: string}>();

  showMenu = false;

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
  }

  onEdit(): void {
    this.showMenu = false;
    this.edit.emit(this.task);
  }

  onDelete(): void {
    this.showMenu = false;
    this.delete.emit(this.task);
  }

  isOverdue(deadline: Date): boolean {
    return new Date(deadline) < new Date();
  }

  isDueSoon(deadline: Date): boolean {
    const now = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays > 0;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const target = new Date(date);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    if (diffDays === -1) return 'Hier';
    if (diffDays < -1) return `Il y a ${Math.abs(diffDays)} jours`;
    if (diffDays <= 7) return `Dans ${diffDays} jours`;
    
    return target.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  }
}
