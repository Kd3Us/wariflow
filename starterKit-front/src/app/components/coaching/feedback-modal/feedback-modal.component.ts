import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { SessionHistoryService, SessionHistory, DetailedFeedback } from '../../../services/session-history.service';

@Component({
  selector: 'app-feedback-modal',
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.scss']
})
export class FeedbackModalComponent implements OnInit, OnChanges {
  @Input() session: SessionHistory | null = null;
  @Input() isVisible = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onFeedbackSubmitted = new EventEmitter<DetailedFeedback>();

  feedbackForm!: FormGroup;
  isSubmitting = false;
  currentStep = 1;
  totalSteps = 3;

  categories = [
    { key: 'communication', label: 'Communication', icon: '💬' },
    { key: 'expertise', label: 'Expertise', icon: '🎓' },
    { key: 'helpfulness', label: 'Utilité', icon: '🤝' },
    { key: 'clarity', label: 'Clarté', icon: '💡' },
    { key: 'preparation', label: 'Préparation', icon: '📋' }
  ];

  predefinedPositiveAspects = [
    'Excellente écoute',
    'Conseils pertinents',
    'Approche structurée',
    'Bonne préparation',
    'Communication claire',
    'Expertise évidente',
    'Disponibilité',
    'Patience',
    'Motivation',
    'Exemples concrets'
  ];

  predefinedImprovementAreas = [
    'Plus d\'exemples pratiques',
    'Davantage d\'interactivité',
    'Meilleure gestion du temps',
    'Plus de supports visuels',
    'Suivi post-séance',
    'Personnalisation',
    'Préparation renforcée',
    'Communication plus claire',
    'Plus de feedback',
    'Approche plus structurée'
  ];

  constructor(
    private fb: FormBuilder,
    private sessionHistoryService: SessionHistoryService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['session'] && this.session) {
      this.loadExistingFeedback();
    }
  }

  initializeForm(): void {
    this.feedbackForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10)]],
      categories: this.fb.group({
        communication: [5, [Validators.min(1), Validators.max(5)]],
        expertise: [5, [Validators.min(1), Validators.max(5)]],
        helpfulness: [5, [Validators.min(1), Validators.max(5)]],
        clarity: [5, [Validators.min(1), Validators.max(5)]],
        preparation: [5, [Validators.min(1), Validators.max(5)]]
      }),
      positiveAspects: this.fb.array([]),
      improvementAreas: this.fb.array([]),
      wouldRecommend: [true],
      isPublic: [false],
      objectives: [''],
      outcomes: [''],
      nextSteps: ['']
    });
  }

  loadExistingFeedback(): void {
    if (!this.session) return;

    this.sessionHistoryService.getSessionFeedback(this.session.id).subscribe({
      next: (feedback) => {
        this.patchFormWithFeedback(feedback);
      },
      error: (error) => {
        if (error.status !== 404) {
          console.error('Error loading existing feedback:', error);
        }
      }
    });
  }

  patchFormWithFeedback(feedback: DetailedFeedback): void {
    this.feedbackForm.patchValue({
      rating: feedback.rating,
      comment: feedback.comment,
      categories: feedback.categories || {},
      wouldRecommend: feedback.wouldRecommend,
      isPublic: feedback.isPublic
    });

    this.setFormArrayValues('positiveAspects', feedback.positiveAspects || []);
    this.setFormArrayValues('improvementAreas', feedback.improvementAreas || []);
  }

  setFormArrayValues(controlName: string, values: string[]): void {
    const formArray = this.feedbackForm.get(controlName) as FormArray;
    formArray.clear();
    values.forEach(value => {
      formArray.push(this.fb.control(value));
    });
  }

  get positiveAspectsArray(): FormArray {
    return this.feedbackForm.get('positiveAspects') as FormArray;
  }

  get improvementAreasArray(): FormArray {
    return this.feedbackForm.get('improvementAreas') as FormArray;
  }

  addPositiveAspect(aspect: string): void {
    if (!this.positiveAspectsArray.value.includes(aspect)) {
      this.positiveAspectsArray.push(this.fb.control(aspect));
    }
  }

  removePositiveAspect(index: number): void {
    this.positiveAspectsArray.removeAt(index);
  }

  addImprovementArea(area: string): void {
    if (!this.improvementAreasArray.value.includes(area)) {
      this.improvementAreasArray.push(this.fb.control(area));
    }
  }

  removeImprovementArea(index: number): void {
    this.improvementAreasArray.removeAt(index);
  }

  addCustomPositiveAspect(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value) {
      this.addPositiveAspect(value);
      input.value = '';
    }
  }

  addCustomImprovementArea(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value) {
      this.addImprovementArea(value);
      input.value = '';
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        const ratingControl = this.feedbackForm.get('rating');
        const commentControl = this.feedbackForm.get('comment');
        return !!(ratingControl?.valid && commentControl?.valid);
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  }

  setRating(rating: number): void {
    this.feedbackForm.patchValue({ rating });
  }

  setCategoryRating(category: string, rating: number): void {
    const categoriesGroup = this.feedbackForm.get('categories') as FormGroup;
    categoriesGroup.patchValue({ [category]: rating });
  }

  getRatingStars(rating: number): Array<{ filled: boolean }> {
    return Array.from({ length: 5 }, (_, i) => ({ filled: i < rating }));
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  close(): void {
    this.currentStep = 1;
    this.feedbackForm.reset();
    this.initializeForm();
    this.onClose.emit();
  }

  submitFeedback(): void {
    if (!this.feedbackForm.valid || !this.session || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.feedbackForm.value;

    const feedbackData = {
      sessionHistoryId: this.session.id,
      userId: 'current-user',
      coachId: this.session.coachId,
      rating: formValue.rating,
      comment: formValue.comment,
      categories: formValue.categories,
      positiveAspects: formValue.positiveAspects,
      improvementAreas: formValue.improvementAreas,
      wouldRecommend: formValue.wouldRecommend,
      isPublic: formValue.isPublic
    };

    this.sessionHistoryService.createDetailedFeedback(feedbackData).subscribe({
      next: (feedback) => {
        this.isSubmitting = false;
        console.log('Feedback envoyé avec succès');
        this.onFeedbackSubmitted.emit(feedback);
        this.close();

        if (formValue.objectives || formValue.outcomes || formValue.nextSteps) {
          this.updateSessionHistory(formValue);
        }
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
        this.isSubmitting = false;
        console.error('Impossible d\'enregistrer le feedback');
      }
    });
  }

  private updateSessionHistory(formValue: any): void {
    if (!this.session) return;

    const updateData: any = {};
    
    if (formValue.objectives) {
      updateData.objectives = formValue.objectives.split('\n').filter((obj: string) => obj.trim());
    }
    
    if (formValue.outcomes) {
      updateData.outcomes = formValue.outcomes.split('\n').filter((out: string) => out.trim());
    }
    
    if (formValue.nextSteps) {
      updateData.nextSteps = formValue.nextSteps.split('\n').filter((step: string) => step.trim());
    }

    if (Object.keys(updateData).length > 0) {
      this.sessionHistoryService.updateSessionHistory(this.session.id, updateData).subscribe({
        next: () => {
          console.log('Session history updated successfully');
        },
        error: (error) => {
          console.error('Error updating session history:', error);
        }
      });
    }
  }

  getOverallAverage(): number {
    const categories = this.feedbackForm.get('categories')?.value;
    if (!categories) return 0;
    
    const values = Object.values(categories) as number[];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}