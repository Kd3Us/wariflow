import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChatbotService, ChatbotResponse } from '../../services/chatbot.service';

@Component({
  selector: 'app-ai-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="overlay" *ngIf="isOpen" (click)="onCancel()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>🧠 Générer un projet avec l'IA</h2>
          <button class="close-button" (click)="onCancel()">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form [formGroup]="aiForm" (ngSubmit)="onGenerate()" *ngIf="!isGenerating && !generationResult">
          <div class="form-group">
            <label for="description">Décrivez votre projet *</label>
            <textarea
              id="description"
              formControlName="description"
              placeholder="Ex: Je veux créer une application mobile de livraison de nourriture avec géolocalisation et paiement en ligne pour les étudiants universitaires..."
              rows="4"
              class="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>
            <div class="character-info">
              <span class="text-xs text-gray-500">
                {{ aiForm.get('description')?.value?.length || 0 }} caractères (minimum 20)
              </span>
            </div>
            <div *ngIf="aiForm.get('description')?.invalid && aiForm.get('description')?.touched" class="error-message">
              La description doit contenir au moins 20 caractères
            </div>
          </div>

          <div class="form-group">
            <label for="context">Contexte du contraintes (optionnel)</label>
            <textarea
              id="context"
              formControlName="context"
              placeholder="Ex: Budget limité, deadline à 3 mois, équipe de 4 personnes..."
              rows="2"
              class="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="targetAudience">Public cible (optionnel)</label>
            <input
              id="targetAudience"
              type="text"
              formControlName="targetAudience"
              placeholder="Ex: Jeunes adultes de 18-35 ans, entreprises B2B..."
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="onCancel()">
              Annuler
            </button>
            <button 
              type="submit" 
              class="btn-ai-primary"
              [disabled]="aiForm.invalid"
            >
              ✨ Générer le projet
            </button>
          </div>
        </form>

        <div *ngIf="isGenerating" class="generation-loading">
          <div class="loading-animation">
            <div class="ai-brain">🧠</div>
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h3>L'IA analyse votre projet...</h3>
          <p>Génération des cartes en cours, veuillez patienter.</p>
        </div>

        <div *ngIf="generationResult && !isGenerating" class="generation-result">
          <div class="result-header">
            <div class="success-icon">✅</div>
            <h3>Projet généré avec succès !</h3>
          </div>

          <div class="result-summary">
            <p><strong>{{ generationResult.projects.length }} cartes</strong> ont été créées automatiquement</p>
            <div class="analysis-preview">
              <div class="analysis-item">
                <span class="label">Type détecté:</span>
                <span class="value">{{ generationResult.analysis.projectType }}</span>
              </div>
              <div class="analysis-item">
                <span class="label">Complexité:</span>
                <span class="value" [class]="getComplexityClass(generationResult.analysis.complexity)">
                  {{ generationResult.analysis.complexity }}
                </span>
              </div>
              <div class="analysis-item">
                <span class="label">Durée estimée:</span>
                <span class="value">{{ generationResult.analysis.estimatedDuration }} jours</span>
              </div>
            </div>
          </div>

          <div class="generated-projects">
            <h4>Cartes créées :</h4>
            <div class="project-list">
              <div *ngFor="let project of generationResult.projects" class="project-item">
                <div class="project-info">
                  <span class="project-title">{{ project.title }}</span>
                  <span class="project-stage">{{ project.stage }}</span>
                </div>
                <span class="project-priority" [class]="getPriorityClass(project.priority)">
                  {{ project.priority }}
                </span>
              </div>
            </div>
          </div>

          <div class="suggestions" *ngIf="generationResult.suggestions.length > 0">
            <h4>💡 Suggestions :</h4>
            <ul>
              <li *ngFor="let suggestion of generationResult.suggestions">{{ suggestion }}</li>
            </ul>
          </div>

          <div class="form-actions">
            <button class="btn-primary" (click)="onComplete()">
              Parfait ! Voir les projets
            </button>
          </div>
        </div>

        <div *ngIf="errorMessage" class="error-result">
          <div class="error-icon">❌</div>
          <h3>Erreur lors de la génération</h3>
          <p>{{ errorMessage }}</p>
          <div class="form-actions">
            <button class="btn-secondary" (click)="resetForm()">
              Réessayer
            </button>
            <button class="btn-primary" (click)="onCancel()">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./ai-project-modal.component.css']
})
export class AiProjectModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() projectsGenerated = new EventEmitter<ChatbotResponse>();

  aiForm: FormGroup;
  isGenerating = false;
  generationResult: ChatbotResponse | null = null;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private chatbotService: ChatbotService
  ) {
    this.aiForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(20)]],
      context: [''],
      targetAudience: ['']
    });
  }

  ngOnInit() {
    this.resetForm();
  }

  onGenerate() {
    if (this.aiForm.invalid) return;

    this.isGenerating = true;
    this.errorMessage = '';

    const formData = this.aiForm.value;
    
    this.chatbotService.generateProject(formData).subscribe({
      next: (result: ChatbotResponse) => {
        this.isGenerating = false;
        this.generationResult = result;
        console.log('✅ [AiModal] Projets générés:', result.projects.length);
      },
      error: (error) => {
        this.isGenerating = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue lors de la génération';
      }
    });
  }

  onComplete() {
    if (this.generationResult) {
      console.log('📤 [AiModal] Émission des projets vers le parent');
      this.projectsGenerated.emit(this.generationResult);
    }
    this.onCancel();
  }

  onCancel() {
    this.resetForm();
    this.close.emit();
  }

  resetForm() {
    this.aiForm.reset();
    this.isGenerating = false;
    this.generationResult = null;
    this.errorMessage = '';
  }

  getComplexityClass(complexity: string): string {
    switch (complexity) {
      case 'simple': return 'text-green-600';
      case 'moyen': return 'text-yellow-600';
      case 'complexe': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
}