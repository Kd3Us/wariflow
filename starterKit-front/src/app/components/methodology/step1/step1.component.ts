import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, Validators } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace.service';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import { PersonForm } from '../../../models/methodology/person.model';

@Component({
  selector: 'app-step1',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Fiche Personne</h1>
        <p class="text-gray-600">
          Renseignez vos informations personnelles pour créer votre profil.
        </p>
      </div>

      <!-- Section d'affichage des données sauvegardées -->
      <div *ngIf="showSavedData && savedPersonData" class="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
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
          <div><strong>Nom:</strong> {{ savedPersonData.nom || 'Non renseigné' }}</div>
          <div><strong>Prénom:</strong> {{ savedPersonData.prenom || 'Non renseigné' }}</div>
          <div><strong>Sexe:</strong> {{ savedPersonData.sexe || 'Non renseigné' }}</div>
          <div><strong>Âge:</strong> {{ savedPersonData.age || 'Non renseigné' }}</div>
          <div><strong>Nationalité:</strong> {{ savedPersonData.nationalite || 'Non renseigné' }}</div>
          <div><strong>Origine:</strong> {{ savedPersonData.origine || 'Non renseigné' }}</div>
        </div>
        <div class="mt-4 text-sm">
          <div><strong>Description:</strong></div>
          <p class="mt-1 text-gray-700">{{ savedPersonData.description || 'Non renseigné' }}</p>
        </div>
        <div class="mt-4 text-sm">
          <div><strong>Parcours utilisateur:</strong></div>
          <p class="mt-1 text-gray-700">{{ savedPersonData.parcoursUtilisateur || 'Non renseigné' }}</p>
        </div>
      </div>

      <!-- Bouton pour afficher les données sauvegardées -->
      <div *ngIf="!showSavedData && savedPersonData" class="mb-6">
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

      <form class="space-y-6" [formGroup]="profileForm" (ngSubmit)="saveAndContinue()">
        <!-- Champs obligatoires -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Nom -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nom <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="nom"
              name="nom"
              placeholder="Votre nom de famille"
              class="input-field"
              required
            />
          </div>

          <!-- Prénom -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Prénom <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="prenom"
              name="prenom"
              placeholder="Votre prénom"
              class="input-field"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Sexe -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Sexe <span class="text-red-500">*</span>
            </label>
            <select
              formControlName="sexe"
              name="sexe"
              class="input-field"
              required
            >
              <option value="">Sélectionnez votre sexe</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <!-- Âge -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Âge <span class="text-red-500">*</span>
            </label>
            <input
              type="number"
              formControlName="age"
              name="age"
              placeholder="Votre âge"
              class="input-field"
              min="16"
              max="120"
              required
            />
          </div>
        </div>

        <!-- Champs optionnels -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Informations complémentaires</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Nationalité -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nationalité
              </label>
              <input
                type="text"
                formControlName="nationalite"
                name="nationalite"
                placeholder="Votre nationalité"
                class="input-field"
              />
            </div>

            <!-- Origine -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Origine
              </label>
              <input
                type="text"
                formControlName="origine"
                name="origine"
                placeholder="Votre origine"
                class="input-field"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              formControlName="description"
              name="description"
              placeholder="Décrivez-vous en quelques mots..."
              class="input-field resize-none"
              rows="4"
            ></textarea>
          </div>

          <!-- Parcours utilisateur -->
          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Parcours utilisateur
            </label>
            <textarea
              formControlName="parcoursUtilisateur"
              name="parcoursUtilisateur"
              placeholder="Décrivez votre parcours et vos expériences..."
              class="input-field resize-none"
              rows="4"
            ></textarea>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="flex justify-end space-x-4 pt-6">
          <!--<button 
            type="button"
            (click)="resetForm()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Réinitialiser
          </button>-->
          <button 
            type="submit"
            (click)="saveAndContinue()"
            [disabled]="!profileForm.valid"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm p-2">
            Enregistrer et continuer
          </button>
        </div>
      </form>
    </div>
  `
})
export class Step1Component implements OnInit {
  private workspaceService = inject(WorkspaceService);
  
  showSavedData = false;
  savedPersonData: PersonForm | null = null;
  
  profileForm = new FormGroup({
    nom: new FormControl('',[Validators.required,
      Validators.minLength(4),
    ]),
    prenom: new FormControl('',[Validators.required,
      Validators.minLength(4),
    ]),
    sexe: new FormControl('',[Validators.required,
      Validators.minLength(4),
    ]),
    age: new FormControl(16,[Validators.required,
      Validators.max(120), Validators.min(16),
    ]),
    nationalite: new FormControl('',[Validators.required,
      Validators.minLength(4),
    ]),
    origine: new FormControl('',[Validators.required,
      Validators.minLength(4),
    ]),
    description: new FormControl('',[Validators.required,
      Validators.minLength(4),
    ]),
    parcoursUtilisateur: new FormControl('',[Validators.required,
      Validators.minLength(4),
    ])
  });

  constructor() {
    // Écouter les changements des données du workspace
    effect(() => {
      const workspaceData = this.workspaceService.workspaceData();
      if (workspaceData.personForm) {
        this.loadFormData(workspaceData.personForm);
      }
    });
  }

  ngOnInit(): void {
    // Charger les données existantes si disponibles
    const workspaceData = this.workspaceService.workspaceData();
    if (workspaceData.personForm) {
      this.loadFormData(workspaceData.personForm);
      this.updateSavedData(workspaceData.personForm);
    }
  }

  private loadFormData(personForm: PersonForm): void {
    this.profileForm.patchValue({
      nom: personForm.nom || '',
      prenom: personForm.prenom || '',
      sexe: personForm.sexe || '',
      age: personForm.age || 16,
      nationalite: personForm.nationalite || '',
      origine: personForm.origine || '',
      description: personForm.description || '',
      parcoursUtilisateur: personForm.parcoursUtilisateur || ''
    });
  }

  private updateSavedData(personForm: PersonForm): void {
    // Vérifier si des données ont été sauvegardées (au moins un champ rempli)
    const hasData = personForm.nom || personForm.prenom || personForm.sexe || 
                   personForm.age || personForm.nationalite || personForm.origine || 
                   personForm.description || personForm.parcoursUtilisateur;
    
    if (hasData) {
      this.savedPersonData = personForm;
    }
  }

  toggleSavedDataDisplay(): void {
    this.showSavedData = !this.showSavedData;
  }

  resetForm(): void {
    this.profileForm.reset();
  }

  saveAndContinue(): void {
    if (this.profileForm.valid) {
      // Sauvegarder les données dans le service workspace
      this.workspaceService.updateWorkspaceData('personForm', this.profileForm.value as PersonForm);
      this.workspaceService.nextStep();
    }
  }
}
