import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, Validators } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace.service';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import { PersonForm, PersonCard, PersonFormData } from '../../../models/methodology/person.model';

@Component({
  selector: 'app-step1',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in mb-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Fiches Persona</h1>
        <p class="text-gray-600">
          Créez plusieurs profils de personas pour mieux comprendre vos utilisateurs cibles.
        </p>
      </div>

      <!-- Section des cartes existantes -->
      <div *ngIf="personCards.length > 0" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Personas créés ({{ personCards.length }})</h2>
          <button 
            type="button"
            (click)="toggleCardsDisplay()"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium">
            {{ showCards ? 'Masquer' : 'Afficher' }} les personas
          </button>
        </div>
        
        <div *ngIf="showCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div *ngFor="let card of personCards; trackBy: trackByCardId" 
               class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ card.prenom }} {{ card.nom }}</h3>
                <p class="text-sm text-gray-600">{{ card.sexe }}, {{ card.age }} ans</p>
              </div>
              <div class="flex space-x-2">
                <button 
                  type="button"
                  (click)="editPersonCard(card)"
                  class="text-blue-600 hover:text-blue-800 text-sm"
                  title="Modifier">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  type="button"
                  (click)="deletePersonCard(card.id)"
                  class="text-red-600 hover:text-red-800 text-sm"
                  title="Supprimer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="space-y-2 text-sm text-gray-600">
              <div *ngIf="card.nationalite"><strong>Nationalité:</strong> {{ card.nationalite }}</div>
              <div *ngIf="card.origine"><strong>Origine:</strong> {{ card.origine }}</div>
              <div *ngIf="card.description" class="line-clamp-2"><strong>Description:</strong> {{ card.description }}</div>
            </div>
            
            <div class="mt-3 pt-3 border-t border-gray-100">
              <p class="text-xs text-gray-500">
                Créé le {{ formatDate(card.dateCreation) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulaire de création/édition -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'Modifier le persona' : 'Nouveau persona' }}
          </h2>
          <button 
            *ngIf="isEditing"
            type="button"
            (click)="cancelEdit()"
            class="text-gray-600 hover:text-gray-800 text-sm font-medium">
            Annuler
          </button>
        </div>

        <form class="space-y-6" [formGroup]="profileForm" (ngSubmit)="savePersonForm()">
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
                placeholder="Nom de famille"
                class="input-field"
                required
              />
              <div *ngIf="profileForm.get('nom')?.invalid && profileForm.get('nom')?.touched" 
                   class="text-red-500 text-xs mt-1">
                Le nom est requis (minimum 2 caractères)
              </div>
            </div>

            <!-- Prénom -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="prenom"
                placeholder="Prénom"
                class="input-field"
                required
              />
              <div *ngIf="profileForm.get('prenom')?.invalid && profileForm.get('prenom')?.touched" 
                   class="text-red-500 text-xs mt-1">
                Le prénom est requis (minimum 2 caractères)
              </div>
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
                class="input-field"
                required
              >
                <option value="">Sélectionnez le sexe</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
                <option value="Autre">Autre</option>
              </select>
              <div *ngIf="profileForm.get('sexe')?.invalid && profileForm.get('sexe')?.touched" 
                   class="text-red-500 text-xs mt-1">
                Le sexe est requis
              </div>
            </div>

            <!-- Âge -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Âge <span class="text-red-500">*</span>
              </label>
              <input
                type="number"
                formControlName="age"
                placeholder="Âge"
                class="input-field"
                min="16"
                max="120"
                required
              />
              <div *ngIf="profileForm.get('age')?.invalid && profileForm.get('age')?.touched" 
                   class="text-red-500 text-xs mt-1">
                L'âge doit être entre 16 et 120 ans
              </div>
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
                  placeholder="Nationalité"
                  class="input-field"
                  required
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
                  placeholder="Origine"
                  class="input-field"
                  required
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
                placeholder="Décrivez ce persona en quelques mots..."
                class="input-field resize-none"
                rows="4"
                required
              ></textarea>
            </div>

            <!-- Parcours utilisateur -->
            <div class="mt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Parcours utilisateur
              </label>
              <textarea
                formControlName="parcoursUtilisateur"
                placeholder="Décrivez le parcours et les expériences de ce persona..."
                class="input-field resize-none"
                rows="4"
                required
              ></textarea>
            </div>
          </div>

          <!-- Boutons d'action -->
          <div class="flex justify-between items-center pt-6">
            <button 
              type="button"
              (click)="resetForm()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Réinitialiser
            </button>
            
            <div class="flex space-x-3">
              <button 
                type="submit"
                [disabled]="!profileForm.valid"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isEditing ? 'Mettre à jour' : 'Ajouter le persona' }}
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Bouton continuer -->
      <div *ngIf="personCards.length > 0" class="flex justify-end mt-8">
        <button 
          type="button"
          (click)="saveAndContinue()"
          class="btn-primary rounded-md text-sm p-3">
          Continuer vers l'étape suivante
        </button>
      </div>
    </div>
  `
})
export class Step1Component implements OnInit {
  private workspaceService = inject(WorkspaceService);
  
  personCards: PersonCard[] = [];
  showCards = true;
  isEditing = false;
  editingCardId: string | null = null;
  
  profileForm = new FormGroup({
    nom: new FormControl('', [
      Validators.required,
      Validators.minLength(2)
    ]),
    prenom: new FormControl('', [
      Validators.required,
      Validators.minLength(2)
    ]),
    sexe: new FormControl('', [Validators.required]),
    age: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(16),
      Validators.max(120)
    ]),
    nationalite: new FormControl('',[
      Validators.required]),
    origine: new FormControl('',[
      Validators.required]),
    description: new FormControl('',[
      Validators.required]),
    parcoursUtilisateur: new FormControl('',[
      Validators.required])
  });

  constructor() {
    // Écouter les changements des données du workspace
    effect(() => {
      const workspaceData = this.workspaceService.workspaceData();
      if (workspaceData.personFormData) {
        this.loadPersonFormData(workspaceData.personFormData);
      }
    });
  }

  ngOnInit(): void {
    // Charger les données existantes si disponibles
    const workspaceData = this.workspaceService.workspaceData();
    if (workspaceData.personFormData) {
      this.loadPersonFormData(workspaceData.personFormData);
    }
  }

  private loadPersonFormData(personFormData: PersonFormData): void {
    this.personCards = personFormData.personForms || [];
    if (personFormData.currentPersonForm) {
      this.profileForm.patchValue(personFormData.currentPersonForm);
    }
  }

  trackByCardId(index: number, card: PersonCard): string {
    return card.id;
  }

  toggleCardsDisplay(): void {
    this.showCards = !this.showCards;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  editPersonCard(card: PersonCard): void {
    this.isEditing = true;
    this.editingCardId = card.id;
    this.profileForm.patchValue({
      nom: card.nom,
      prenom: card.prenom,
      sexe: card.sexe,
      age: card.age,
      nationalite: card.nationalite,
      origine: card.origine,
      description: card.description,
      parcoursUtilisateur: card.parcoursUtilisateur
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingCardId = null;
    this.resetForm();
  }

  deletePersonCard(cardId: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce persona ?')) {
      this.personCards = this.personCards.filter(card => card.id !== cardId);
      this.updateWorkspaceData();
    }
  }

  resetForm(): void {
    this.profileForm.reset();
    this.profileForm.patchValue({
      age: null
    });
  }

  savePersonForm(): void {
    if (this.profileForm.valid) {
      const formValue = {
        nom: this.profileForm.value.nom || '',
        prenom: this.profileForm.value.prenom || '',
        sexe: this.profileForm.value.sexe || '',
        age: this.profileForm.value.age || 0,
        nationalite: this.profileForm.value.nationalite || '',
        origine: this.profileForm.value.origine || '',
        description: this.profileForm.value.description || '',
        parcoursUtilisateur: this.profileForm.value.parcoursUtilisateur || ''
      } as PersonForm;
      
      if (this.isEditing && this.editingCardId) {
        // Mettre à jour la carte existante
        const cardIndex = this.personCards.findIndex(card => card.id === this.editingCardId);
        if (cardIndex !== -1) {
          const updatedCard = new PersonCard(formValue, this.editingCardId);
          updatedCard.dateCreation = this.personCards[cardIndex].dateCreation; // Conserver la date de création originale
          this.personCards[cardIndex] = updatedCard;
        }
        this.cancelEdit();
      } else {
        // Ajouter une nouvelle carte
        const newCard = new PersonCard(formValue);
        this.personCards.push(newCard);
        this.resetForm();
      }
      
      this.updateWorkspaceData();
    }
  }

  private updateWorkspaceData(): void {
    const currentPersonForm = {
      nom: this.profileForm.value.nom || '',
      prenom: this.profileForm.value.prenom || '',
      sexe: this.profileForm.value.sexe || '',
      age: this.profileForm.value.age || 0,
      nationalite: this.profileForm.value.nationalite || '',
      origine: this.profileForm.value.origine || '',
      description: this.profileForm.value.description || '',
      parcoursUtilisateur: this.profileForm.value.parcoursUtilisateur || ''
    } as PersonForm;

    const personFormData: PersonFormData = {
      personForms: this.personCards,
      currentPersonForm: currentPersonForm
    };
    
    this.workspaceService.updateWorkspaceData('personFormData', personFormData);
  }

  saveAndContinue(): void {
    if (this.personCards.length > 0) {
      this.updateWorkspaceData();
      this.workspaceService.nextStep();
    }
  }
}
