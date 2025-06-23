import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

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

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
    this.loadAvailableUsers();
  }

  private loadAvailableUsers(): void {
    this.loading = true;
    // Mock data - replace with actual service call
    this.availableUsers = [
      { id: 'user-1', name: 'Alice Martin', email: 'alice@example.com', role: 'Designer', avatar: '/assets/avatars/alice.jpg' },
      { id: 'user-2', name: 'Bob Dupont', email: 'bob@example.com', role: 'Developer', avatar: '/assets/avatars/bob.jpg' },
      { id: 'user-3', name: 'Claire Dubois', email: 'claire@example.com', role: 'Product Manager' },
      { id: 'user-4', name: 'David Bernard', email: 'david@example.com', role: 'QA Engineer' }
    ].filter(user => !this.currentTeamIds.includes(user.id));
    this.loading = false;
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