import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, Validators } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace.service';
import { FormControl, ReactiveFormsModule, FormArray } from '@angular/forms';
import { StorytellingForm, ARCHETYPES, NARRATIVE_STRUCTURES } from '../../../models/methodology/storytelling.model';

@Component({
  selector: 'app-step3',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Storytelling</h1>
        <p class="text-gray-600">
          Définissez votre stratégie narrative et créez un storytelling captivant pour votre projet.
        </p>
      </div>

      <!-- Section d'affichage des données sauvegardées -->
      <div *ngIf="showSavedData && savedStorytellingData" class="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
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
          <div><strong>Structure narrative:</strong> {{ getStructureName(savedStorytellingData.structureNarrative) || 'Non renseigné' }}</div>
          <div><strong>Archétypes sélectionnés:</strong> {{ savedStorytellingData.archetypes.length || 0 }}/3</div>
        </div>
        <div class="mt-4 text-sm" *ngIf="savedStorytellingData.archetypes && savedStorytellingData.archetypes.length > 0">
          <div><strong>Archétypes:</strong></div>
          <div class="mt-1 flex flex-wrap gap-2">
            <span *ngFor="let archetypeId of savedStorytellingData.archetypes" 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {{ getArchetypeName(archetypeId) }}
            </span>
          </div>
        </div>
        <div class="mt-4 text-sm">
          <div><strong>Pitch:</strong></div>
          <p class="mt-1 text-gray-700">{{ savedStorytellingData.pitch || 'Non renseigné' }}</p>
        </div>
      </div>

      <!-- Bouton pour afficher les données sauvegardées -->
      <div *ngIf="!showSavedData && savedStorytellingData" class="mb-6">
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

      <form class="space-y-8" [formGroup]="storytellingForm" (ngSubmit)="saveAndContinue()">
        
        <!-- Section Archétypes -->
        <div class="border-b pb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Archétypes</h2>
          <p class="text-sm text-gray-600 mb-6">Sélectionnez jusqu'à 3 archétypes qui correspondent à votre marque ou projet.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let archetype of archetypes" class="relative">
              <input
                type="checkbox"
                [id]="archetype.id"
                [value]="archetype.id"
                (change)="onArchetypeChange($event)"
                [disabled]="selectedArchetypes.length >= 3 && !isArchetypeSelected(archetype.id)"
                class="peer sr-only"
              />
              <label 
                [for]="archetype.id" 
                class="flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                <div class="flex flex-1 flex-col">
                  <span class="block text-sm font-medium text-gray-900">{{ archetype.name }}</span>
                  <span class="mt-1 text-xs text-gray-500">{{ archetype.description }}</span>
                </div>
                <svg class="h-5 w-5 text-blue-600 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </label>
            </div>
          </div>
          
          <div class="mt-4 text-sm text-gray-600">
            <span class="font-medium">Sélectionnés: {{ selectedArchetypes.length }}/3</span>
            <div *ngIf="selectedArchetypes.length > 0" class="mt-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2" 
                    *ngFor="let archetypeId of selectedArchetypes">
                {{ getArchetypeName(archetypeId) }}
                <button type="button" (click)="removeArchetype(archetypeId)" class="ml-1 text-blue-600 hover:text-blue-800">
                  <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- Section Structure Narrative -->
        <div class="border-b pb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Structure Narrative du pitch</h2>
          <p class="text-sm text-gray-600 mb-6">Choisissez la structure narrative qui convient le mieux à votre storytelling.</p>
          
          <div class="space-y-4">
            <div *ngFor="let structure of narrativeStructures" class="relative">
              <input
                type="radio"
                [id]="structure.id"
                formControlName="structureNarrative"
                [value]="structure.id"
                class="peer sr-only"
              />
              <label [for]="structure.id" class="flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                <div class="flex flex-1 flex-col">
                  <span class="block text-sm font-medium text-gray-900">{{ structure.name }}</span>
                  <span class="mt-1 text-sm text-gray-500">{{ structure.description }}</span>
                </div>
                <svg class="h-5 w-5 text-blue-600 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </label>
            </div>
          </div>
        </div>

        <!-- Section Pitch -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Pitch</h2>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Votre Pitch <span class="text-red-500">*</span>
            </label>
            <textarea
              formControlName="pitch"
              placeholder="Rédigez votre pitch en quelques phrases percutantes. Présentez votre projet, sa valeur unique et pourquoi il est important..."
              class="input-field resize-none"
              rows="6"
              required
            ></textarea>
            <p class="mt-2 text-sm text-gray-500">
              Un bon pitch doit être clair, concis et captivant. Il doit expliquer ce que vous faites, pour qui, et pourquoi c'est important.
            </p>
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
            <!--<button 
              type="button"
              (click)="resetForm()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Réinitialiser
            </button>-->
            <button 
              type="submit"
              [disabled]="!storytellingForm.valid || selectedArchetypes.length === 0"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm p-2">
              Enregistrer et continuer
            </button>
          </div>
        </div>
      </form>
    </div>
  `
})
export class Step3Component implements OnInit {
  private workspaceService = inject(WorkspaceService);
  
  archetypes = ARCHETYPES;
  narrativeStructures = NARRATIVE_STRUCTURES;
  selectedArchetypes: string[] = [];
  showSavedData = false;
  savedStorytellingData: StorytellingForm | null = null;
  
  storytellingForm = new FormGroup({
    structureNarrative: new FormControl('', [
      Validators.required
    ]),
    pitch: new FormControl('', [
      Validators.required,
      Validators.minLength(50)
    ])
  });

  constructor() {
    // Écouter les changements des données du workspace
    effect(() => {
      const workspaceData = this.workspaceService.workspaceData();
      if (workspaceData.storytellingForm) {
        this.loadFormData(workspaceData.storytellingForm);
      }
    });
  }

  ngOnInit(): void {
    // Charger les données existantes si disponibles
    const workspaceData = this.workspaceService.workspaceData();
    if (workspaceData.storytellingForm) {
      this.loadFormData(workspaceData.storytellingForm);
      this.updateSavedData(workspaceData.storytellingForm);
    }
  }

  private loadFormData(storytellingForm: StorytellingForm): void {
    this.storytellingForm.patchValue({
      structureNarrative: storytellingForm.structureNarrative || '',
      pitch: storytellingForm.pitch || ''
    });
    
    // Charger les archétypes sélectionnés
    if (storytellingForm.archetypes) {
      this.selectedArchetypes = [...storytellingForm.archetypes];
      // Cocher les checkboxes correspondantes
      storytellingForm.archetypes.forEach(archetypeId => {
        const checkbox = document.getElementById(archetypeId) as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }
  }

  private updateSavedData(storytellingForm: StorytellingForm): void {
    // Vérifier si des données ont été sauvegardées (au moins un champ rempli)
    const hasData = storytellingForm.structureNarrative || storytellingForm.pitch || 
                   (storytellingForm.archetypes && storytellingForm.archetypes.length > 0);
    
    if (hasData) {
      this.savedStorytellingData = storytellingForm;
    }
  }

  toggleSavedDataDisplay(): void {
    this.showSavedData = !this.showSavedData;
  }

  getStructureName(structureId: string): string {
    const structure = this.narrativeStructures.find(s => s.id === structureId);
    return structure ? structure.name : structureId;
  }

  onArchetypeChange(event: any): void {
    const archetypeId = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      if (this.selectedArchetypes.length < 3) {
        this.selectedArchetypes.push(archetypeId);
      } else {
        event.target.checked = false;
      }
    } else {
      this.selectedArchetypes = this.selectedArchetypes.filter(id => id !== archetypeId);
    }
  }

  isArchetypeSelected(archetypeId: string): boolean {
    return this.selectedArchetypes.includes(archetypeId);
  }

  getArchetypeName(archetypeId: string): string {
    const archetype = this.archetypes.find(a => a.id === archetypeId);
    return archetype ? archetype.name : archetypeId;
  }

  removeArchetype(archetypeId: string): void {
    this.selectedArchetypes = this.selectedArchetypes.filter(id => id !== archetypeId);
    // Décocher la checkbox correspondante
    const checkbox = document.getElementById(archetypeId) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = false;
    }
  }

  resetForm(): void {
    this.storytellingForm.reset();
    this.selectedArchetypes = [];
    // Décocher toutes les checkboxes
    this.archetypes.forEach(archetype => {
      const checkbox = document.getElementById(archetype.id) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = false;
      }
    });
  }

  goBack(): void {
    this.workspaceService.previousStep();
  }

  saveAndContinue(): void {
    if (this.storytellingForm.valid && this.selectedArchetypes.length > 0) {
      const formData: StorytellingForm = {
        archetypes: this.selectedArchetypes,
        structureNarrative: this.storytellingForm.value.structureNarrative!,
        pitch: this.storytellingForm.value.pitch!
      };
      
      // Sauvegarder les données dans le service workspace
      this.workspaceService.updateWorkspaceData('storytellingForm', formData);
      this.workspaceService.nextStep();
    }
  }
}
