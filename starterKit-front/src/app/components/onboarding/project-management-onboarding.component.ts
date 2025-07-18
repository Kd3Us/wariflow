import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-management-onboarding',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Overlay -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <!-- Modal Container -->
      <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        <!-- Progress Bar -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-semibold text-gray-800">Guide du Tableau de Gestion de Projet</h2>
            <button 
              (click)="closeOnboarding()" 
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="flex space-x-2">
            <div *ngFor="let step of steps; let i = index" 
                 class="flex-1 h-2 rounded-full transition-all duration-300"
                 [class]="currentStep >= i ? 'bg-blue-500' : 'bg-gray-200'">
            </div>
          </div>
          <div class="text-sm text-gray-500 mt-2">
            Étape {{ currentStep + 1 }} sur {{ steps.length }}
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          
          <!-- Step 1: Introduction -->
          <div *ngIf="currentStep === 0" class="animate-fade-in">
            <div class="text-center mb-8">
              <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Bienvenue dans la Gestion de Projet</h3>
              <p class="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
                Ce tableau de bord vous permet de gérer efficacement vos projets avec une approche Kanban. 
                Organisez vos tâches, suivez leur progression et collaborez avec votre équipe.
              </p>
            </div>

            <div class="grid md:grid-cols-2 gap-6 mb-8">
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <h4 class="font-semibold text-gray-800">Gestion Visuelle</h4>
                </div>
                <p class="text-gray-600 text-sm">
                  Visualisez instantanément l'état de toutes vos tâches grâce aux colonnes Kanban
                </p>
              </div>

              <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <h4 class="font-semibold text-gray-800">Collaboration</h4>
                </div>
                <p class="text-gray-600 text-sm">
                  Assignez des tâches aux membres de votre équipe et suivez leur progression
                </p>
              </div>
            </div>
          </div>

          <!-- Step 2: Colonnes Kanban -->
          <div *ngIf="currentStep === 1" class="animate-fade-in">
            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Les 4 Colonnes de Workflow</h3>
              <p class="text-gray-600 text-lg">
                Chaque tâche progresse à travers ces étapes pour assurer un suivi optimal
              </p>
            </div>

            <div class="grid md:grid-cols-4 gap-4 mb-8">
              <div class="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-semibold text-gray-700">PENDING</h4>
                  <span class="px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-600">À faire</span>
                </div>
                <div class="text-sm text-gray-600 mb-4">
                  Nouvelles tâches en attente de démarrage
                </div>
                <div class="bg-white rounded-md p-3 border border-gray-200">
                  <div class="text-xs text-gray-500 mb-1">Exemple</div>
                  <div class="font-medium text-sm">Créer la maquette</div>
                  <div class="text-xs text-gray-500 mt-1">Priorité: Moyenne</div>
                </div>
              </div>

              <div class="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-semibold text-blue-700">IN PROGRESS</h4>
                  <span class="px-2 py-1 bg-blue-200 rounded-full text-xs text-blue-800">En cours</span>
                </div>
                <div class="text-sm text-blue-600 mb-4">
                  Tâches actuellement en développement
                </div>
                <div class="bg-white rounded-md p-3 border border-blue-200">
                  <div class="text-xs text-blue-500 mb-1">Exemple</div>
                  <div class="font-medium text-sm">Développer l'API</div>
                  <div class="text-xs text-blue-500 mt-1">Assigné à: John</div>
                </div>
              </div>

              <div class="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-semibold text-yellow-700">TEST</h4>
                  <span class="px-2 py-1 bg-yellow-200 rounded-full text-xs text-yellow-800">Test</span>
                </div>
                <div class="text-sm text-yellow-600 mb-4">
                  Tâches en phase de test et validation
                </div>
                <div class="bg-white rounded-md p-3 border border-yellow-200">
                  <div class="text-xs text-yellow-500 mb-1">Exemple</div>
                  <div class="font-medium text-sm">Tester les fonctionnalités</div>
                  <div class="text-xs text-yellow-500 mt-1">QA en cours</div>
                </div>
              </div>

              <div class="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-semibold text-green-700">DONE</h4>
                  <span class="px-2 py-1 bg-green-200 rounded-full text-xs text-green-800">Terminé</span>
                </div>
                <div class="text-sm text-green-600 mb-4">
                  Tâches complètement terminées
                </div>
                <div class="bg-white rounded-md p-3 border border-green-200">
                  <div class="text-xs text-green-500 mb-1">Exemple</div>
                  <div class="font-medium text-sm">Déploiement prod</div>
                  <div class="text-xs text-green-500 mt-1">100% complété</div>
                </div>
              </div>
            </div>

            <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div class="flex items-start">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-1">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h5 class="font-semibold text-blue-800 mb-1">Astuce</h5>
                  <p class="text-blue-700 text-sm">
                    Vous pouvez glisser-déposer les tâches d'une colonne à l'autre pour changer leur statut automatiquement !
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Fonctionnalités principales -->
          <div *ngIf="currentStep === 2" class="animate-fade-in">
            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Fonctionnalités Principales</h3>
              <p class="text-gray-600 text-lg">
                Découvrez tous les outils à votre disposition pour gérer efficacement vos projets
              </p>
            </div>

            <div class="space-y-6">
              <!-- Sélection de projet -->
              <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div class="flex items-start">
                  <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-800 mb-2">Sélection de Projet</h4>
                    <p class="text-gray-600 text-sm mb-3">
                      Choisissez le projet sur lequel vous souhaitez travailler. Toutes les tâches affichées seront liées à ce projet.
                    </p>
                    <div class="bg-white rounded-lg p-3 border border-purple-200">
                      <div class="text-xs text-purple-600 mb-1">Interface</div>
                      <div class="text-sm font-medium">Menu déroulant "Projet actuel"</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Création de tâches -->
              <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div class="flex items-start">
                  <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-800 mb-2">Création de Tâches</h4>
                    <p class="text-gray-600 text-sm mb-3">
                      Créez de nouvelles tâches soit globalement, soit directement dans une colonne spécifique.
                    </p>
                    <div class="grid md:grid-cols-2 gap-3">
                      <div class="bg-white rounded-lg p-3 border border-green-200">
                        <div class="text-xs text-green-600 mb-1">Bouton principal</div>
                        <div class="text-sm font-medium">"Créer tâche"</div>
                      </div>
                      <div class="bg-white rounded-lg p-3 border border-green-200">
                        <div class="text-xs text-green-600 mb-1">Boutons colonnes</div>
                        <div class="text-sm font-medium">Icône "+" sur chaque colonne</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- IA Génération -->
              <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                <div class="flex items-start">
                  <div class="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-800 mb-2">Génération IA</h4>
                    <p class="text-gray-600 text-sm mb-3">
                      Laissez l'IA générer automatiquement des tâches pertinentes pour votre projet en fonction de sa description.
                    </p>
                    <div class="bg-white rounded-lg p-3 border border-indigo-200">
                      <div class="text-xs text-indigo-600 mb-1">Bouton magique</div>
                      <div class="text-sm font-medium">"Générer avec IA" ✨</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Actions sur les tâches -->
          <div *ngIf="currentStep === 3" class="animate-fade-in">
            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Actions sur les Tâches</h3>
              <p class="text-gray-600 text-lg">
                Gérez vos tâches avec toutes les actions disponibles
              </p>
            </div>

            <div class="grid md:grid-cols-2 gap-6 mb-8">
              <!-- Drag & Drop -->
              <div class="bg-white rounded-xl p-6 border-2 border-dashed border-blue-300">
                <div class="text-center">
                  <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                    </svg>
                  </div>
                  <h4 class="font-semibold text-gray-800 mb-2">Glisser-Déposer</h4>
                  <p class="text-gray-600 text-sm">
                    Déplacez les tâches entre les colonnes pour changer leur statut automatiquement
                  </p>
                </div>
              </div>

              <!-- Édition -->
              <div class="bg-white rounded-xl p-6 border-2 border-dashed border-green-300">
                <div class="text-center">
                  <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </div>
                  <h4 class="font-semibold text-gray-800 mb-2">Édition</h4>
                  <p class="text-gray-600 text-sm">
                    Cliquez sur une tâche pour modifier ses détails, assignations et priorités
                  </p>
                </div>
              </div>
            </div>

            <!-- Exemple de carte de tâche -->
            <div class="bg-gray-50 rounded-xl p-6">
              <h4 class="font-semibold text-gray-800 mb-4 text-center">Exemple de Carte de Tâche</h4>
              <div class="max-w-sm mx-auto">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div class="flex items-center justify-between mb-3">
                    <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">HIGH</span>
                    <div class="flex space-x-1">
                      <button class="w-6 h-6 text-gray-400 hover:text-blue-600 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button class="w-6 h-6 text-gray-400 hover:text-red-600 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h5 class="font-semibold text-gray-800 mb-2">Développer l'interface utilisateur</h5>
                  <p class="text-gray-600 text-sm mb-3">Créer les composants React pour la page d'accueil</p>
                  <div class="flex items-center justify-between">
                    <div class="flex space-x-1">
                      <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">frontend</span>
                      <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">react</span>
                    </div>
                    <div class="flex -space-x-2">
                      <div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                      <div class="w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                  </div>
                  <div class="mt-3 bg-gray-100 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: 65%"></div>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">65% complété</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 5: Conseils et bonnes pratiques -->
          <div *ngIf="currentStep === 4" class="animate-fade-in">
            <div class="text-center mb-8">
              <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-800 mb-4">Conseils & Bonnes Pratiques</h3>
              <p class="text-gray-600 text-lg">
                Optimisez votre workflow avec ces recommandations
              </p>
            </div>

            <div class="space-y-4 mb-8">
              <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                <div class="flex items-start">
                  <svg class="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <div>
                    <h4 class="font-semibold text-green-800 mb-1">Limitez le WIP (Work In Progress)</h4>
                    <p class="text-green-700 text-sm">
                      Ne mettez pas trop de tâches en "IN PROGRESS" simultanément. Concentrez-vous sur 2-3 tâches maximum.
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                <div class="flex items-start">
                  <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h4 class="font-semibold text-blue-800 mb-1">Utilisez des descriptions claires</h4>
                    <p class="text-blue-700 text-sm">
                      Rédigez des titres et descriptions précis pour que toute l'équipe comprenne rapidement l'objectif.
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
                <div class="flex items-start">
                  <svg class="w-5 h-5 text-purple-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h4 class="font-semibold text-purple-800 mb-1">Définissez des priorités</h4>
                    <p class="text-purple-700 text-sm">
                      Utilisez les niveaux de priorité (LOW, MEDIUM, HIGH) pour organiser le travail de l'équipe.
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-400">
                <div class="flex items-start">
                  <svg class="w-5 h-5 text-orange-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <div>
                    <h4 class="font-semibold text-orange-800 mb-1">Assignez les bonnes personnes</h4>
                    <p class="text-orange-700 text-sm">
                      Assignez les tâches aux membres de l'équipe selon leurs compétences et disponibilités.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-800 mb-1">Prêt à commencer ?</h4>
                  <p class="text-gray-600 text-sm">
                    Vous avez maintenant toutes les clés pour utiliser efficacement le tableau de gestion de projet !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div class="flex justify-between items-center">
            <button 
              *ngIf="currentStep > 0"
              (click)="prevStep()" 
              class="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Précédent
            </button>
            <div *ngIf="currentStep === 0"></div>

            <div class="flex gap-3">
              <button 
                (click)="closeOnboarding()" 
                class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Passer
              </button>
              <button 
                *ngIf="currentStep < steps.length - 1"
                (click)="nextStep()" 
                class="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Suivant
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
              <button 
                *ngIf="currentStep === steps.length - 1"
                (click)="closeOnboarding()" 
                class="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Commencer !
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProjectManagementOnboardingComponent {
  @Output() close = new EventEmitter<void>();
  
  currentStep = 0;
  steps = [0, 1, 2, 3, 4];

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  closeOnboarding() {
    this.close.emit();
  }
}
