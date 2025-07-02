import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, GenerateProjectRequest, ChatbotResponse } from '../../services/chatbot.service';

@Component({
  selector: 'app-ai-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="onCancel()">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold text-gray-900">
            Génération automatique de projets
          </h2>
          <button (click)="onCancel()" class="text-gray-400 hover:text-gray-600">
            <span class="material-icons text-2xl">close</span>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description du projet <span class="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                [(ngModel)]="request.description"
                placeholder="Décrivez votre projet en détail : objectifs, fonctionnalités, technologie..."
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="4"
                required
                minlength="20"
              ></textarea>
              <p class="mt-1 text-sm text-gray-500">
                Minimum 20 caractères. Plus vous donnez de détails, plus la génération sera précise.
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Contexte (optionnel)
              </label>
              <textarea
                name="context"
                [(ngModel)]="request.context"
                placeholder="Contexte métier, contraintes, environnement technique..."
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Public cible (optionnel)
              </label>
              <input
                type="text"
                name="targetAudience"
                [(ngModel)]="request.targetAudience"
                placeholder="Qui sont vos utilisateurs finaux ?"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              (click)="onCancel()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="!form.valid || isLoading"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <span *ngIf="isLoading" class="material-icons animate-spin mr-2 text-sm">hourglass_empty</span>
              {{ isLoading ? 'Génération...' : 'Générer les projets' }}
            </button>
          </div>
        </form>

        <div *ngIf="lastResult && !isLoading" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 class="text-sm font-medium text-green-800 mb-2">Génération réussie !</h3>
          <p class="text-sm text-green-700">
            {{ lastResult.message }}
          </p>
          <div *ngIf="lastResult.suggestions && lastResult.suggestions.length > 0" class="mt-3">
            <h4 class="text-sm font-medium text-green-800">Suggestions :</h4>
            <ul class="mt-1 text-sm text-green-700 list-disc list-inside">
              <li *ngFor="let suggestion of lastResult.suggestions">{{ suggestion }}</li>
            </ul>
          </div>
        </div>

        <div *ngIf="error" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 class="text-sm font-medium text-red-800 mb-2">Erreur</h3>
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>
  `
})
export class AiProjectModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() projectsGenerated = new EventEmitter<ChatbotResponse>();

  request: GenerateProjectRequest = {
    description: '',
    context: '',
    targetAudience: ''
  };

  isLoading = false;
  error: string | null = null;
  lastResult: ChatbotResponse | null = null;

  constructor(private chatbotService: ChatbotService) {}

  onSubmit(): void {
    if (this.request.description.length < 20) {
      this.error = 'La description doit contenir au moins 20 caractères';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.lastResult = null;

    console.log('Génération de projets IA démarrée');

    this.chatbotService.generateProject(this.request).subscribe({
      next: (result) => {
        console.log('Projets générés avec succès:', result);
        this.isLoading = false;
        this.lastResult = result;
        
        setTimeout(() => {
          this.projectsGenerated.emit(result);
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur lors de la génération:', error);
        this.isLoading = false;
        this.error = error.error?.message || 'Une erreur est survenue lors de la génération';
      }
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}