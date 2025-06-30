import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, Validators } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { VisualIdentityForm } from '../../../models/methodology/visual-identity.model';

@Component({
  selector: 'app-step2',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Identité Visuelle & Expérience</h1>
        <p class="text-gray-600">
          Définissez l'identité visuelle de votre projet et l'expérience utilisateur souhaitée.
        </p>
      </div>

      <!-- Section d'affichage des données sauvegardées -->
      <div *ngIf="showSavedData && savedVisualIdentityData" class="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-green-800">Données sauvegardées sur le backend</h3>
          <button 
            type="button"
            (click)="toggleSavedDataDisplay()"
            class="text-green-600 hover:text-green-800 text-sm font-medium">
            Masquer
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><strong>Slogan:</strong> {{ savedVisualIdentityData.slogan || 'Non renseigné' }}</div>
          <div><strong>Typography:</strong> {{ savedVisualIdentityData.typography || 'Non renseigné' }}</div>
          <div><strong>Expérience utilisateur:</strong> {{ savedVisualIdentityData.experienceUtilisateur || 'Non renseigné' }}</div>
        </div>
        <div class="mt-4 text-sm">
          <div><strong>Valeurs:</strong></div>
          <p class="mt-1 text-gray-700">{{ savedVisualIdentityData.valeurs || 'Non renseigné' }}</p>
        </div>
        <div class="mt-4 text-sm">
          <div><strong>Ton & Message:</strong></div>
          <p class="mt-1 text-gray-700">{{ savedVisualIdentityData.tonMessage || 'Non renseigné' }}</p>
        </div>
      </div>

      <!-- Bouton pour afficher les données sauvegardées -->
      <div *ngIf="!showSavedData && savedVisualIdentityData" class="mb-6">
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

      <form class="space-y-8" [formGroup]="visualIdentityForm" (ngSubmit)="saveAndContinue()">
        
        <!-- Section Identités Visuelles -->
        <div class="border-b pb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Identités Visuelles</h2>
          
          <div class="space-y-6">
            <!-- Logo Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              
              <!-- Logo actuel -->
              <div *ngIf="currentLogoBase64 && !selectedLogoFile" class="mb-4 p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-4">
                  <img [src]="getLogoDataUrl()" alt="Logo actuel" class="h-16 w-16 object-contain rounded-md border">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">Logo actuel</p>
                    <p class="text-xs text-gray-500">Cliquez sur "Télécharger un fichier" pour le remplacer</p>
                  </div>
                  <button 
                    type="button"
                    (click)="removeLogo()"
                    class="text-red-600 hover:text-red-800 text-sm">
                    Supprimer
                  </button>
                </div>
              </div>

              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div class="space-y-1 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <div class="flex text-sm text-gray-600">
                    <label for="logo-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>{{ currentLogoBase64 ? 'Remplacer le logo' : 'Télécharger un fichier' }}</span>
                      <input id="logo-upload" name="logo-upload" type="file" class="sr-only" accept="image/*" (change)="onLogoChange($event)">
                    </label>
                    <p class="pl-1">ou glisser-déposer</p>
                  </div>
                  <p class="text-xs text-gray-500">PNG, JPG, GIF jusqu'à 10MB</p>
                  <div *ngIf="selectedLogoName" class="mt-2 text-sm text-green-600">
                    Nouveau fichier sélectionné: {{ selectedLogoName }}
                  </div>
                  <div *ngIf="isProcessingLogo" class="mt-2 text-sm text-blue-600">
                    Traitement en cours...
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Slogan -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Slogan <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  formControlName="slogan"
                  placeholder="Votre slogan accrocheur"
                  class="input-field"
                  required
                />
              </div>

              <!-- Typography -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Typography <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  formControlName="typography"
                  placeholder="Police de caractères (ex: Arial, Helvetica)"
                  class="input-field"
                  required
                />
              </div>
            </div>

            <!-- Valeurs -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Valeurs <span class="text-red-500">*</span>
              </label>
              <textarea
                formControlName="valeurs"
                placeholder="Décrivez les valeurs de votre projet..."
                class="input-field resize-none"
                rows="3"
                required
              ></textarea>
            </div>

            <!-- Ton & Message -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Ton & Message <span class="text-red-500">*</span>
              </label>
              <textarea
                formControlName="tonMessage"
                placeholder="Quel ton souhaitez-vous adopter ? Quel message véhiculer ?"
                class="input-field resize-none"
                rows="3"
                required
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Section Expérience utilisateur -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Expérience utilisateur</h2>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Type de plateforme <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="relative">
                <input
                  type="radio"
                  id="site-web"
                  formControlName="experienceUtilisateur"
                  value="site-web"
                  class="peer sr-only"
                />
                <label for="site-web" class="flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                  <span class="flex flex-1 flex-col">
                    <span class="block text-sm font-medium text-gray-900">Site web</span>
                    <span class="mt-1 flex items-center text-sm text-gray-500">Application web</span>
                  </span>
                  <svg class="h-5 w-5 text-blue-600 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </label>
              </div>

              <div class="relative">
                <input
                  type="radio"
                  id="mobile-app"
                  formControlName="experienceUtilisateur"
                  value="mobile-app"
                  class="peer sr-only"
                />
                <label for="mobile-app" class="flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                  <span class="flex flex-1 flex-col">
                    <span class="block text-sm font-medium text-gray-900">Mobile App</span>
                    <span class="mt-1 flex items-center text-sm text-gray-500">Application mobile</span>
                  </span>
                  <svg class="h-5 w-5 text-blue-600 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </label>
              </div>

              <div class="relative">
                <input
                  type="radio"
                  id="discord"
                  formControlName="experienceUtilisateur"
                  value="discord"
                  class="peer sr-only"
                />
                <label for="discord" class="flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                  <span class="flex flex-1 flex-col">
                    <span class="block text-sm font-medium text-gray-900">Discord</span>
                    <span class="mt-1 flex items-center text-sm text-gray-500">Bot Discord</span>
                  </span>
                  <svg class="h-5 w-5 text-blue-600 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </label>
              </div>

              <div class="relative">
                <input
                  type="radio"
                  id="autre"
                  formControlName="experienceUtilisateur"
                  value="autre"
                  class="peer sr-only"
                />
                <label for="autre" class="flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                  <span class="flex flex-1 flex-col">
                    <span class="block text-sm font-medium text-gray-900">Autre</span>
                    <span class="mt-1 flex items-center text-sm text-gray-500">Autre plateforme</span>
                  </span>
                  <svg class="h-5 w-5 text-blue-600 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="flex justify-between pt-6 pb-8">
          <button 
            type="button"
            (click)="goBack()"
            class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="w-4 h-4 mr-2 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Retour</span>
          </button>

          <div class="flex space-x-4">
            <button 
              type="submit"
              [disabled]="!visualIdentityForm.valid"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm p-2">
              Enregistrer et continuer
            </button>
          </div>
        </div>
      </form>
    </div>
  `
})
export class Step2Component implements OnInit {
  private workspaceService = inject(WorkspaceService);
  
  selectedLogoName: string = '';
  selectedLogoFile: File | null = null;
  currentLogoBase64: string = '';
  currentLogoMimeType: string = '';
  isProcessingLogo = false;
  showSavedData = false;
  savedVisualIdentityData: VisualIdentityForm | null = null;
  
  visualIdentityForm = new FormGroup({
    slogan: new FormControl('', [
      Validators.required,
      Validators.minLength(3)
    ]),
    typography: new FormControl('', [
      Validators.required,
      Validators.minLength(2)
    ]),
    valeurs: new FormControl('', [
      Validators.required,
      Validators.minLength(10)
    ]),
    tonMessage: new FormControl('', [
      Validators.required,
      Validators.minLength(10)
    ]),
    experienceUtilisateur: new FormControl('', [
      Validators.required
    ])
  });

  constructor() {
    // Écouter les changements des données du workspace
    effect(() => {
      const workspaceData = this.workspaceService.workspaceData();
      if (workspaceData.visualIdentityForm) {
        this.loadFormData(workspaceData.visualIdentityForm);
      }
    });
  }

  ngOnInit(): void {
    // Charger les données existantes si disponibles
    const workspaceData = this.workspaceService.workspaceData();
    if (workspaceData.visualIdentityForm) {
      this.loadFormData(workspaceData.visualIdentityForm);
      this.updateSavedData(workspaceData.visualIdentityForm);
    }
  }

  private loadFormData(visualIdentityForm: VisualIdentityForm): void {
    this.visualIdentityForm.patchValue({
      slogan: visualIdentityForm.slogan || '',
      typography: visualIdentityForm.typography || '',
      valeurs: visualIdentityForm.valeurs || '',
      tonMessage: visualIdentityForm.tonMessage || '',
      experienceUtilisateur: visualIdentityForm.experienceUtilisateur || ''
    });
    
    // Charger le logo base64 si disponible
    if (visualIdentityForm.logoBase64) {
      this.currentLogoBase64 = visualIdentityForm.logoBase64;
      this.currentLogoMimeType = visualIdentityForm.logoMimeType || '';
    }
  }

  private updateSavedData(visualIdentityForm: VisualIdentityForm): void {
    // Vérifier si des données ont été sauvegardées (au moins un champ rempli)
    const hasData = visualIdentityForm.slogan || visualIdentityForm.typography || 
                   visualIdentityForm.valeurs || visualIdentityForm.tonMessage || 
                   visualIdentityForm.experienceUtilisateur;
    
    if (hasData) {
      this.savedVisualIdentityData = visualIdentityForm;
    }
  }

  toggleSavedDataDisplay(): void {
    this.showSavedData = !this.showSavedData;
  }

  getLogoDataUrl(): string {
    if (this.currentLogoBase64 && this.currentLogoMimeType) {
      return `data:${this.currentLogoMimeType};base64,${this.currentLogoBase64}`;
    }
    return '';
  }

  onLogoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale : 10MB');
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }

      this.selectedLogoName = file.name;
      this.selectedLogoFile = file;
      
      // Convertir immédiatement en base64
      this.convertToBase64(file);
    }
  }

  private convertToBase64(file: File): void {
    this.isProcessingLogo = true;
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Extraire le base64 sans le préfixe data:image/...;base64,
      const base64Data = result.split(',')[1];
      
      this.currentLogoBase64 = base64Data;
      this.currentLogoMimeType = file.type;
      this.isProcessingLogo = false;
    };
    
    reader.onerror = () => {
      this.isProcessingLogo = false;
      alert('Erreur lors de la lecture du fichier');
    };
    
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.currentLogoBase64 = '';
    this.currentLogoMimeType = '';
    this.selectedLogoName = '';
    this.selectedLogoFile = null;
  }

  resetForm(): void {
    this.visualIdentityForm.reset();
    this.selectedLogoName = '';
    this.selectedLogoFile = null;
    this.currentLogoBase64 = '';
    this.currentLogoMimeType = '';
  }

  goBack(): void {
    this.workspaceService.previousStep();
  }

  async saveAndContinue(): Promise<void> {
    if (this.visualIdentityForm.valid) {
      try {
        // Créer l'objet VisualIdentityForm avec toutes les données
        const visualIdentityData: VisualIdentityForm = {
          ...this.visualIdentityForm.value as VisualIdentityForm,
          logoBase64: this.currentLogoBase64,
          logoMimeType: this.currentLogoMimeType,
          logo: this.selectedLogoFile
        };

        // Sauvegarder les données dans le service workspace
        this.workspaceService.updateWorkspaceData('visualIdentityForm', visualIdentityData);
        this.workspaceService.nextStep();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
    }
  }
}
