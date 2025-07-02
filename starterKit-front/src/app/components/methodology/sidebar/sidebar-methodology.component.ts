import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceStep } from '../../../models/workspace.types';
import { LoaderComponent } from '../../loader/loader.component';
import { Observable } from 'rxjs';
import { LoaderService } from '../../../services/loader.service';
import { WorkspaceService } from '../../../services/workspace.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `
  <!-- Loader -->
    <app-loader *ngIf="isLoading$ | async"></app-loader>

    <div class="w-80 bg-white border-r border-gray-200 min-h-screen">
      <div class="p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Méthodologie Guidée</h1>
          <div class="flex items-center text-sm text-gray-600 mb-2">
            Outils & templates pour structurer son projet comme un pro.
          </div>
          <div class="text-xs my-4 text-secondary font-medium">Etape {{ currentStep }} sur 4</div>
        </div>

        <!-- Steps -->
        <div class="space-y-4">
          <div *ngFor="let step of steps" 
               class="flex items-start p-2 rounded-lg transition-colors duration-200"
               [ngClass]="{
                 'cursor-pointer hover:bg-gray-50': canNavigateToStep(step.id),
                 'cursor-not-allowed opacity-60': !canNavigateToStep(step.id)
               }"
               (click)="navigateToStep(step.id)">
            <!-- Step indicator -->
            <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-colors duration-200"
                 [ngClass]="{
                   'bg-secondary text-white': step.completed || step.active,
                   'bg-gray-200 text-gray-500': !step.completed && !step.active
                 }">
              <svg *ngIf="step.completed" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span *ngIf="!step.completed" class="text-sm font-medium">{{ step.id }}</span>
            </div>
            
            <!-- Step content -->
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-900 mb-1">{{ step.title }}</h3>
              <p class="text-xs text-gray-500" [innerHTML]="getStepDescription(step.id)"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SidebarMethodologyComponent {
  @Input() steps: WorkspaceStep[] = [];
  @Input() currentStep: number = 1;
  isLoading$: Observable<boolean>;

    constructor(
      private loaderService: LoaderService,
      private workspaceService: WorkspaceService
    ) {
      this.isLoading$ = this.loaderService.isLoading$;
    }
    

  getStepDescription(stepId: number): string {
    const descriptions = {
      1: 'Créer votre fiche personne.',
      2: 'Créer votre branding.',
      3: 'Créer votre Storytelling.',
      4: 'Créer votre business model.'
    };
    return descriptions[stepId as keyof typeof descriptions] || '';
  }

  navigateToStep(stepId: number): void {
    // Permettre la navigation seulement vers l'étape actuelle ou les étapes complétées
    if (this.canNavigateToStep(stepId)) {
      this.workspaceService.goToStep(stepId);
    }
  }

  canNavigateToStep(stepId: number): boolean {
    // Toujours permettre la navigation vers l'étape actuelle
    if (stepId === this.currentStep) {
      return true;
    }

    // Vérifier si les données de l'étape sont remplies
    const workspaceData = this.workspaceService.workspaceData();
    
    switch (stepId) {
      case 1:
        // Step 1 navigable si personFormData existe et a des données
        return !!(workspaceData.personFormData && 
                 workspaceData.personFormData.personForms && 
                 workspaceData.personFormData.personForms.length > 0);
      
      case 2:
        // Step 2 navigable si visualIdentityForm n'est pas null/vide
        return !!(workspaceData.visualIdentityForm && 
                 this.isFormFilled(workspaceData.visualIdentityForm));
      
      case 3:
        // Step 3 navigable si storytellingForm n'est pas null/vide
        return !!(workspaceData.storytellingForm && 
                 this.isFormFilled(workspaceData.storytellingForm));
      
      case 4:
        // Step 4 navigable si businessModelForm n'est pas null/vide
        return !!(workspaceData.businessModelForm && 
                 this.isFormFilled(workspaceData.businessModelForm));
      
      default:
        return false;
    }
  }

  private isFormFilled(form: any): boolean {
    if (!form) return false;
    
    // Vérifier si au moins une propriété du formulaire a une valeur non vide
    return Object.values(form).some(value => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length > 0;
      }
      return value !== null && value !== undefined;
    });
  }
}
