import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubStep } from '../../models/project.model';
import { ProjectsService } from '../../services/project.service';

@Component({
  selector: 'app-project-substeps',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-substeps.component.html',
  styleUrls: ['./project-substeps.component.css']
})
export class ProjectSubstepsComponent implements OnInit, OnChanges {
  @Input() projectId: string = '';
  @Input() initialSubSteps: SubStep[] = [];
  @Output() subStepsChange = new EventEmitter<SubStep[]>();

  subSteps: SubStep[] = [];
  showForm = false;
  subStepForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectsService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadSubSteps();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialSubSteps']) {
      this.loadSubSteps();
    }
  }

  private loadSubSteps(): void {
    if (this.initialSubSteps && this.initialSubSteps.length > 0) {
      this.subSteps = [...this.initialSubSteps];
      this.subStepsChange.emit(this.subSteps);
    }
  }

  private initForm(): void {
    this.subStepForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.subStepForm.reset({
        title: '',
        description: ''
      });
    }
  }

  onSubmit(): void {
    if (this.subStepForm.invalid) {
      this.subStepForm.markAllAsTouched();
      return;
    }

    const formData = this.subStepForm.value;
    this.isLoading = true;

    this.projectService.addSubStep(this.projectId, {
      title: formData.title,
      description: formData.description || ''
    }).subscribe({
      next: (updatedProject) => {
        this.subSteps = updatedProject.subSteps || [];
        this.subStepsChange.emit(this.subSteps);
        this.toggleForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error adding substep:', error);
        this.isLoading = false;
      }
    });
  }

  toggleCompletion(subStep: SubStep): void {
    this.isLoading = true;
    this.projectService.toggleSubStepCompletion(this.projectId, subStep.id).subscribe({
      next: (updatedProject) => {
        this.subSteps = updatedProject.subSteps || [];
        this.subStepsChange.emit(this.subSteps);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error toggling substep:', error);
        this.isLoading = false;
      }
    });
  }

  deleteSubStep(subStep: SubStep): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sous-étape ?')) {
      this.isLoading = true;
      this.projectService.deleteSubStep(this.projectId, subStep.id).subscribe({
        next: (updatedProject) => {
          this.subSteps = updatedProject.subSteps || [];
          this.subStepsChange.emit(this.subSteps);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting substep:', error);
          this.isLoading = false;
        }
      });
    }
  }

  get sortedSubSteps(): SubStep[] {
    return [...this.subSteps].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return a.order - b.order;
    });
  }

  get completedCount(): number {
    return this.subSteps.filter(s => s.isCompleted).length;
  }

  get completionPercentage(): number {
    if (this.subSteps.length === 0) return 0;
    return Math.round((this.completedCount / this.subSteps.length) * 100);
  }
}