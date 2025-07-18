import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeamsService, TeamMember, CreateTeamMemberDto } from '../../services/teams.service';

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
  @Output() teamCreated = new EventEmitter<TeamMember>();

  searchForm!: FormGroup;
  createTeamForm!: FormGroup;
  availableUsers: TeamMember[] = [];
  selectedUsers: string[] = [];
  loading = false;
  showCreateTeamForm = false;
  creatingTeam = false;

  constructor(private fb: FormBuilder, private teamsService: TeamsService) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
    
    this.createTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      avatar: ['']
    });
    
    this.loadAvailableUsers();
  }

  private loadAvailableUsers(): void {
    this.loading = true;
    this.teamsService.getAllTeamMembers().subscribe({
      next: (users) => {
        this.availableUsers = users.filter(user => !this.currentTeamIds.includes(user.id));
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.loading = false;
        // En cas d'erreur, on peut garder un fallback avec des données vides ou afficher un message d'erreur
        this.availableUsers = [];
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

  showCreateForm(): void {
    this.showCreateTeamForm = true;
  }

  hideCreateForm(): void {
    this.showCreateTeamForm = false;
    this.createTeamForm.reset();
  }

  onCreateTeam(): void {
    if (this.createTeamForm.valid && !this.creatingTeam) {
      this.creatingTeam = true;
      
      const teamData: CreateTeamMemberDto = {
        name: this.createTeamForm.get('name')?.value,
        email: this.createTeamForm.get('email')?.value,
        role: this.createTeamForm.get('role')?.value,
        avatar: this.createTeamForm.get('avatar')?.value || undefined
      };

      this.teamsService.createTeamMember(teamData).subscribe({
        next: (newTeamMember) => {
          console.log('Nouveau membre d\'équipe créé:', newTeamMember);
          this.teamCreated.emit(newTeamMember);
          this.loadAvailableUsers(); // Recharger la liste des utilisateurs
          this.hideCreateForm();
          this.creatingTeam = false;
        },
        error: (error) => {
          console.error('Erreur lors de la création du membre d\'équipe:', error);
          this.creatingTeam = false;
          // Ici vous pourriez ajouter une notification d'erreur
        }
      });
    }
  }

  onCancel(): void {
    this.selectedUsers = [];
    this.hideCreateForm();
    this.close.emit();
  }

  onConfirm(): void {
    if (this.selectedUsers.length > 0) {
      this.userAdded.emit(this.selectedUsers);
      this.selectedUsers = [];
    }
  }
}
