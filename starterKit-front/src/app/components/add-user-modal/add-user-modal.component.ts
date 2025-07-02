import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TeamsService, TeamMember } from '../../services/teams.service';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css']
})
export class AddUserModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() currentTeamIds: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<string[]>();

  searchForm!: FormGroup;
  availableUsers: TeamMember[] = [];
  selectedUsers: string[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private teamsService: TeamsService
  ) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
    this.loadAvailableUsers();
  }

  private loadAvailableUsers(): void {
    this.loading = true;
    this.teamsService.getAllMembers().subscribe({
      next: (users) => {
        this.availableUsers = users.filter(user => 
          !this.currentTeamIds.includes(user.id)
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredUsers(): TeamMember[] {
    const searchTerm = this.searchForm.get('searchTerm')?.value?.toLowerCase() || '';
    return this.availableUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.role.toLowerCase().includes(searchTerm)
    );
  }

  toggleUserSelection(userId: string): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.includes(userId);
  }

  onCancel(): void {
    this.selectedUsers = [];
    this.close.emit();
  }

  onConfirm(): void {
    if (this.selectedUsers.length > 0) {
      this.userAdded.emit(this.selectedUsers);
      this.selectedUsers = [];
    }
  }
}