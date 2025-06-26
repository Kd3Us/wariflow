import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, Validators } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BusinessModelForm } from '../../../models/methodology/business.model';


@Component({
  selector: 'app-step4',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Businesss model</h1>
        <p class="text-gray-600">
          Formaliser ton business model, c'est poser les bases solides de ton activité. En quelques minutes, clarifie ton offre, ton public cible et ta stratégie. C'est simple, rapide et essentiel pour faire grandir ton idée.
        </p>
      </div>

      <!-- Section d'affichage des données sauvegardées -->
      <div *ngIf="showSavedData && savedBusinessModelData" class="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-green-800">Données sauvegardées sur le backend</h3>
          <button 
            type="button"
            (click)="toggleSavedDataDisplay()"
            class="text-green-600 hover:text-green-800 text-sm font-medium">
            Masquer
          </button>
        </div>
        <div class="mt-4 text-sm">
          <div><strong>Market:</strong></div>
          <p class="mt-1 text-gray-700">{{ savedBusinessModelData.market || 'Non renseigné' }}</p>
        </div>
        <div class="mt-4 text-sm">
          <div><strong>Pricing:</strong></div>
          <p class="mt-1 text-gray-700">{{ savedBusinessModelData.pricing || 'Non renseigné' }}</p>
        </div>
      </div>

      <!-- Bouton pour afficher les données sauvegardées -->
      <div *ngIf="!showSavedData && savedBusinessModelData" class="mb-6">
        <button 
          type="button"
          (click)="toggleSavedDataDisplay()"
          class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Afficher les données sauvegardées</span>
        </button>
      </div>

      <form class="space-y-8" [formGroup]="businessModelForm" (ngSubmit)="processAndSetup()">
        <div class="mb-8">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Market</h2>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Analyse du marché <span class="text-red-500">*</span>
              </label>
              <textarea
                formControlName="market"
                placeholder="Rédigez votre market..."
                class="input-field resize-none"
                rows="6"
                required
              ></textarea>
            </div>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-gray-900 my-6">Pricing</h2>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Votre Pricing <span class="text-red-500">*</span>
              </label>
              <textarea
                formControlName="pricing"
                placeholder="Rédigez votre pricing..."
                class="input-field resize-none"
                rows="6"
                required
              ></textarea>
            </div>
          </div>

        </div>

        <!-- Boutons d'action -->
        <div class="flex justify-between pt-6 pb-8">
          <button 
            type="button"
            (click)="goBack()"
            class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 btn-secondary rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="w-4 h-4 mr-2 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Retour</span>
          </button>

          <div class="flex space-x-4">
            <!--<button 
              type="button"
              (click)="resetForm()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Réinitialiser
            </button>-->
            <button 
              type="submit"
              [disabled]="!businessModelForm.valid"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm p-2">
              Enregistrer et continuer
            </button>
          </div>
        </div>

      </form>
    </div>
  `
})
export class Step4Component implements OnInit {
  private workspaceService = inject(WorkspaceService);
  
  showSavedData = false;
  savedBusinessModelData: BusinessModelForm | null = null;

  businessModelForm = new FormGroup({
    market: new FormControl('', [
      Validators.required,
      Validators.minLength(10)
    ]),
    pricing: new FormControl('', [
      Validators.required,
      Validators.minLength(10)
    ])
  });

  constructor() {
    // Écouter les changements des données du workspace
    effect(() => {
      const workspaceData = this.workspaceService.workspaceData();
      if (workspaceData.businessModelForm) {
        this.loadFormData(workspaceData.businessModelForm);
      }
    });
  }

  ngOnInit(): void {
    // Charger les données existantes si disponibles
    const workspaceData = this.workspaceService.workspaceData();
    if (workspaceData.businessModelForm) {
      this.loadFormData(workspaceData.businessModelForm);
      this.updateSavedData(workspaceData.businessModelForm);
    }
  }

  private loadFormData(businessModelForm: BusinessModelForm): void {
    this.businessModelForm.patchValue({
      market: businessModelForm.market || '',
      pricing: businessModelForm.pricing || ''
    });
  }

  private updateSavedData(businessModelForm: BusinessModelForm): void {
    // Vérifier si des données ont été sauvegardées (au moins un champ rempli)
    const hasData = businessModelForm.market || businessModelForm.pricing;
    
    if (hasData) {
      this.savedBusinessModelData = businessModelForm;
    }
  }

  toggleSavedDataDisplay(): void {
    this.showSavedData = !this.showSavedData;
  }

  goBack(): void {
    this.workspaceService.previousStep();
  }

  processAndSetup(): void {
    if (this.businessModelForm.valid) {
      this.workspaceService.updateWorkspaceData('businessModelForm', this.businessModelForm.value as BusinessModelForm);
      // Here you would typically navigate to the main application or show a success message
      console.log('Workspace setup completed!', this.workspaceService.workspaceData());
    }
  }

  resetForm(): void {
    this.businessModelForm.reset();
  }
}
