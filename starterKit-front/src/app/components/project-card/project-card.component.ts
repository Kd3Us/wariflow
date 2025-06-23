import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project.model';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-card.component.html',
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Output() edit = new EventEmitter<Project>();
  @Output() delete = new EventEmitter<Project>();
  @Output() addUsers = new EventEmitter<string>();
  @Output() removeUser = new EventEmitter<{ projectId: string, userId: string }>();

  menuOpen = false;
  showTeamMenu = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
      this.showTeamMenu = false;
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

  // Nouvelles méthodes pour la gestion des utilisateurs
  onAddUsersClick(event: Event): void {
    event.stopPropagation();
    this.addUsers.emit(this.project.id);
  }

  onRemoveUserClick(event: Event, userId: string): void {
    event.stopPropagation();
    this.removeUser.emit({ projectId: this.project.id, userId });
  }

  toggleTeamMenu(event: Event): void {
    event.stopPropagation();
    this.showTeamMenu = !this.showTeamMenu;
  }

  get displayedTeamMembers(): TeamMember[] {
    return this.project.team.slice(0, 3);
  }

  get additionalMembersCount(): number {
    return Math.max(0, this.project.team.length - 3);
  }

  trackByMemberId(index: number, member: TeamMember): string {
    return member.id;
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
      return '#48bb78'; // success
    } else if (this.project.progress >= 50) {
      return '#6b46c1'; // purple
    } else if (this.project.progress >= 25) {
      return '#f6ad55'; // warning
    } else {
      return '#e53e3e'; // error
    }
  }
}