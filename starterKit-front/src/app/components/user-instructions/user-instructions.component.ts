import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface UserInstruction {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-user-instructions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-instructions.component.html',
  styleUrls: ['./user-instructions.component.css']
})
export class UserInstructionsComponent implements OnInit, OnChanges {
  @Input() projectId: string = '';
  @Input() initialInstructions: UserInstruction[] = [];
  @Output() instructionsChange = new EventEmitter<UserInstruction[]>();

  instructions: UserInstruction[] = [];
  showForm = false;
  instructionForm!: FormGroup;
  priorities = ['LOW', 'MEDIUM', 'HIGH'];

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadInstructions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialInstructions']) {
      this.loadInstructions();
    }
  }

  private loadInstructions(): void {
    if (this.initialInstructions && this.initialInstructions.length > 0) {
      this.instructions = [...this.initialInstructions];
      this.instructionsChange.emit(this.instructions);
    }
  }

  private initForm(): void {
    this.instructionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      priority: ['MEDIUM', [Validators.required]],
      dueDate: ['']
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.instructionForm.reset({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: ''
      });
    }
  }

  onSubmit(): void {
    if (this.instructionForm.invalid) {
      this.instructionForm.markAllAsTouched();
      return;
    }

    const formData = this.instructionForm.value;
    const instruction: UserInstruction = {
      id: this.generateId(),
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      completed: false,
      createdAt: new Date()
    };

    this.instructions.push(instruction);
    this.instructionsChange.emit(this.instructions);
    this.toggleForm();
  }

  toggleCompletion(instruction: UserInstruction): void {
    instruction.completed = !instruction.completed;
    this.instructionsChange.emit(this.instructions);
  }

  deleteInstruction(instruction: UserInstruction): void {
    this.instructions = this.instructions.filter(i => i.id !== instruction.id);
    this.instructionsChange.emit(this.instructions);
  }

  get sortedInstructions(): UserInstruction[] {
    return [...this.instructions].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  get completedCount(): number {
    return this.instructions.filter(i => i.completed).length;
  }

  get completionPercentage(): number {
    if (this.instructions.length === 0) return 0;
    return Math.round((this.completedCount / this.instructions.length) * 100);
  }

  getPriorityLabel(priority: string): string {
    const labels = { HIGH: 'Élevée', MEDIUM: 'Moyenne', LOW: 'Faible' };
    return labels[priority as keyof typeof labels];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}