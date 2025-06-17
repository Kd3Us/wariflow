import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project, ProjectStage } from '../../models/project.model';
import { UserInstructionsComponent, UserInstruction } from '../user-instructions/user-instructions.component';

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
  currentInstructions: UserInstruction[] = [];
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.initForm();
    if (this.project && this.project.instructions) {
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
      tags: [this.project?.tags || []],
      reminderDate: [this.project?.reminderDate ? this.formatDate(this.project.reminderDate) : null],
      teamIds: [this.project?.team?.map(member => member.id) || [], []]
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
  
  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    
    const formData = this.projectForm.value;
    const projectData = {
      ...formData,
      deadline: new Date(formData.deadline),
      reminderDate: formData.reminderDate ? new Date(formData.reminderDate) : undefined,
      tags: typeof formData.tags === 'string' 
        ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
        : formData.tags,
      instructions: this.currentInstructions
    };
    
    this.save.emit(projectData);
  }
  
  onCancel(): void {
    this.cancel.emit();
  }

  onInstructionsChange(instructions: UserInstruction[]): void {
    this.currentInstructions = [...instructions];
  }
}