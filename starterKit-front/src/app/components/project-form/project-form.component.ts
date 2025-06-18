import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project, ProjectStage, TeamMember, UserInstruction } from '../../models/project.model';
import { TeamsService } from '../../services/teams.service';
import { UserInstructionsComponent } from '../user-instructions/user-instructions.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UserInstructionsComponent],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.css']
})
export class ProjectFormComponent implements OnInit {
  @Input() project: Project | null = null;
  @Output() save = new EventEmitter<Partial<Project>>();
  @Output() cancel = new EventEmitter<void>();
  
  projectForm!: FormGroup;
  projectStages = Object.values(ProjectStage);
  priorities = ['LOW', 'MEDIUM', 'HIGH'];
  availableMembers: TeamMember[] = [];
  selectedTeamIds: string[] = [];
  currentInstructions: UserInstruction[] = [];
  
  constructor(
    private fb: FormBuilder,
    private teamsService: TeamsService
  ) {}
  
  ngOnInit(): void {
    this.loadAvailableMembers();
    this.initForm();
    this.initSelectedMembers();
    this.initInstructions();
  }

  private loadAvailableMembers(): void {
    this.teamsService.getAllMembers().subscribe({
      next: (members) => {
        this.availableMembers = members;
      },
      error: (error) => {
        console.error('Error loading team members:', error);
      }
    });
  }

  private initSelectedMembers(): void {
    if (this.project?.team) {
      this.selectedTeamIds = this.project.team.map(member => member.id);
    }
  }

  private initInstructions(): void {
    if (this.project?.instructions) {
      this.currentInstructions = [...this.project.instructions];
    }
  }
  
  private initForm(): void {
    this.projectForm = this.fb.group({
      title: [this.project?.title || '', [Validators.required, Validators.minLength(3)]],
      description: [this.project?.description || '', [Validators.required]],
      stage: [this.project?.stage || ProjectStage.IDEE, [Validators.required]],
      progress: [this.project?.progress || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      deadline: [this.project?.deadline ? this.formatDate(this.project.deadline) : '', [Validators.required]],
      priority: [this.project?.priority || 'MEDIUM', [Validators.required]],
      tags: [this.project?.tags?.join(', ') || ''],
      reminderDate: [this.project?.reminderDate ? this.formatDate(this.project.reminderDate) : '']
    });
  }
  
  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  isSelectedMember(memberId: string): boolean {
    return this.selectedTeamIds.includes(memberId);
  }

  toggleMember(memberId: string): void {
    const index = this.selectedTeamIds.indexOf(memberId);
    if (index > -1) {
      this.selectedTeamIds.splice(index, 1);
    } else {
      this.selectedTeamIds.push(memberId);
    }
  }

  removeMember(memberId: string): void {
    const index = this.selectedTeamIds.indexOf(memberId);
    if (index > -1) {
      this.selectedTeamIds.splice(index, 1);
    }
  }

  getMemberById(memberId: string): TeamMember | undefined {
    return this.availableMembers.find(member => member.id === memberId);
  }
  
  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    
    const formData = this.projectForm.value;
    
    const projectData = {
      title: formData.title,
      description: formData.description,
      stage: formData.stage,
      progress: formData.progress,
      deadline: new Date(formData.deadline),
      priority: formData.priority,
      tags: typeof formData.tags === 'string' 
        ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
        : formData.tags || [],
      reminderDate: formData.reminderDate ? new Date(formData.reminderDate) : undefined,
      teamIds: this.selectedTeamIds,
      instructions: this.currentInstructions
    };
    
    this.save.emit(projectData);
  }

  onInstructionsChange(instructions: UserInstruction[]): void {
    this.currentInstructions = instructions;
  }
  
  onCancel(): void {
    this.cancel.emit();
  }
}