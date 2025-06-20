import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, AddUserModalComponent],
  templateUrl: './project-card.component.html',
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Output() edit = new EventEmitter<Project>();
  @Output() delete = new EventEmitter<Project>();
  @Output() projectUpdated = new EventEmitter<Project>();

  menuOpen = false;
  showAddUserModal = false;

  constructor(
    private elementRef: ElementRef,
    private projectService: ProjectService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  onEdit(): void {
    this.edit.emit(this.project);
    this.menuOpen = false;
  }

  onDelete(): void {
    this.delete.emit(this.project);
    this.menuOpen = false;
  }

  openAddUserModal(): void {
    this.showAddUserModal = true;
    this.menuOpen = false;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
  }

  getCurrentTeamIds(): string[] {
    return this.project.team.map(member => member.id);
  }

  onUsersAdded(userIds: string[]): void {
    this.projectService.addUsersToProject(this.project.id, userIds).subscribe({
      next: (updatedProject) => {
        this.project = updatedProject;
        this.projectUpdated.emit(updatedProject);
        this.closeAddUserModal();
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout des utilisateurs:', error);
      }
    });
  }

  removeUser(userId: string, event: MouseEvent): void {
    event.stopPropagation();
    const user = this.project.team.find(m => m.id === userId);
    if (!confirm(`Retirer ${user?.name} de l'équipe ?`)) return;

    this.projectService.removeUserFromProject(this.project.id, userId).subscribe({
      next: (updatedProject) => {
        this.project = updatedProject;
        this.projectUpdated.emit(updatedProject);
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  }

  getFormattedDueDate(): string {
    if (!this.project.deadline) return 'No deadline';
    return formatDistanceToNow(new Date(this.project.deadline), { addSuffix: true, locale: fr });
  }

  get isNearDeadline(): boolean {
    if (!this.project.deadline) return false;
    const deadline = new Date(this.project.deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  }

  get isPastDeadline(): boolean {
    if (!this.project.deadline) return false;
    return new Date(this.project.deadline) < new Date();
  }

  get deadlineText(): string {
    if (!this.project.deadline) return 'No deadline';
    if (this.isPastDeadline) {
      return 'Overdue';
    }
    return formatDistanceToNow(new Date(this.project.deadline), { addSuffix: true, locale: fr });
  }

  formatReminderDate(): string {
    if (!this.project.reminderDate) return '';
    return formatDistanceToNow(new Date(this.project.reminderDate), { addSuffix: true, locale: fr });
  }

  getProgressColor(): string {
    if (this.project.progress >= 75) {
      return '#48bb78';
    } else if (this.project.progress >= 50) {
      return '#6b46c1';
    } else if (this.project.progress >= 25) {
      return '#f6ad55';
    } else {
      return '#e53e3e';
    }
  }
}