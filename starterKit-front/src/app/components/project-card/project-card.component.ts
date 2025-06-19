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
    const now = new Date();
    const deadline = new Date(this.project.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }

  get isPastDeadline(): boolean {
    if (!this.project.deadline) return false;
    const now = new Date();
    const deadline = new Date(this.project.deadline);
    return deadline < now;
  }

  get deadlineText(): string {
    if (!this.project.deadline) return '';
    const now = new Date();
    const deadline = new Date(this.project.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)}j en retard`;
    }
    return `${diffDays}j restants`;
  }

  formatReminderDate(): string {
    if (!this.project.reminderDate) return '';
    return new Date(this.project.reminderDate).toLocaleDateString('fr-FR');
  }

  get completedInstructions(): number {
    if (!this.project.instructions) return 0;
    return this.project.instructions.filter(instruction => instruction.completed).length;
  }

  get instructionProgress(): number {
    if (!this.project.instructions || this.project.instructions.length === 0) return 0;
    return Math.round((this.completedInstructions / this.project.instructions.length) * 100);
  }
}