import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8 h-screen flex items-center justify-center">
      <!-- Progress Bar -->
      <div class="fixed top-[5rem] left-1/2 transform -translate-x-1/2 z-10">
        <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
          <div *ngFor="let step of steps; let i = index" 
               class="w-3 h-3 rounded-full transition-all duration-300"
               [class]="currentStep === i ? 'bg-white scale-125' : currentStep > i ? 'bg-white/70' : 'bg-white/30'">
          </div>
        </div>
      </div>

      <!-- Step 1: Welcome -->
      <div *ngIf="currentStep === 0" 
           class="text-center max-w-2xl animate-fade-in">
        <div class="mb-8">
          <div class="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
            <img src="assets/images/logo.png" alt="logo-brain" class="h-auto max-w-full" />
          </div>
          <h1 class="text-5xl font-bold text-white mb-4">Bienvenue sur StarterKit</h1>
          <p class="text-xl text-white/80 leading-relaxed">
            Gérez vos projets comme un pro avec notre tableau de bord intuitif. 
            Transformez vos idées en succès.
          </p>
        </div>
        <button (click)="nextStep()" class="btn-primary rounded-md text-lg px-8 py-4">
          Commencer l'aventure
          <svg class="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>

      <!-- Step 2: Features Overview -->
      <div *ngIf="currentStep === 1" 
           class="max-w-4xl animate-slide-in-right">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-white mb-4">Organisez vos projets</h2>
          <p class="text-xl text-white/80">Quatre colonnes pour suivre l'évolution de vos idées</p>
        </div>
        
        <div class="grid md:grid-cols-4 gap-6 mb-8">
          <div class="card p-6 text-center transform hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-800 mb-2">IDÉES</h3>
            <p class="text-sm text-gray-600">Capturez toutes vos inspirations</p>
          </div>
          
          <div class="card p-6 text-center transform hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-800 mb-2">MVP</h3>
            <p class="text-sm text-gray-600">Développez vos prototypes</p>
          </div>
          
          <div class="card p-6 text-center transform hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-800 mb-2">TRACTION</h3>
            <p class="text-sm text-gray-600">Mesurez votre croissance</p>
          </div>
          
          <div class="card p-6 text-center transform hover:scale-105 transition-transform">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-800 mb-2">LEVÉE</h3>
            <p class="text-sm text-gray-600">Obtenez des financements</p>
          </div>
        </div>
        
        <div class="flex justify-between">
          <button (click)="prevStep()" class="flex items-center gap-2 px-4 py-2 rounded-md font-medium cursor-pointer btn-secondary">
            <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Retour
          </button>
          <button (click)="nextStep()" class="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-light">
            Continuer
            <svg class="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Step 3: Project Management -->
      <div *ngIf="currentStep === 2" 
           class="max-w-5xl animate-slide-in-right">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-white mb-4">Gérez vos projets efficacement</h2>
          <p class="text-xl text-white/80">Suivez les priorités et les délais de chaque projet</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          <!-- Sample Project Cards -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="priority-low">LOW</span>
              <span class="text-sm text-gray-500 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                dans 6 jours
              </span>
            </div>
            <h3 class="font-semibold text-gray-800 mb-2">Dashboard Analytics</h3>
            <p class="text-sm text-gray-600 mb-4">Développement du tableau de bord analytics avec métriques en temps réel</p>
            <div class="flex items-center justify-between">
              <div class="flex space-x-1">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">analytics</span>
                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">dashboard</span>
              </div>
              <div class="flex -space-x-2">
                <div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white"></div>
                <div class="w-8 h-8 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          </div>
          
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="priority-high">HIGH</span>
              <span class="text-sm text-gray-500 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                dans environ 12 heures
              </span>
            </div>
            <h3 class="font-semibold text-gray-800 mb-2">Landing Page Redesign</h3>
            <p class="text-sm text-gray-600 mb-4">Refonte complète de la landing page avec nouveau design et optimisation UX</p>
            <div class="flex items-center justify-between">
              <div class="flex space-x-1">
                <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">design</span>
                <span class="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded">frontend</span>
              </div>
              <div class="flex -space-x-2">
                <div class="w-8 h-8 bg-purple-500 rounded-full border-2 border-white"></div>
                <div class="w-8 h-8 bg-pink-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          </div>
          
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="priority-medium">MEDIUM</span>
              <span class="text-sm text-gray-500 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                dans 14 jours
              </span>
            </div>
            <h3 class="font-semibold text-gray-800 mb-2">API Mobile Integration</h3>
            <p class="text-sm text-gray-600 mb-4">Intégration des APIs mobiles pour l'application native</p>
            <div class="flex items-center justify-between">
              <div class="flex space-x-1">
                <span class="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded">mobile</span>
                <span class="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">api</span>
              </div>
              <div class="flex -space-x-2">
                <div class="w-8 h-8 bg-cyan-500 rounded-full border-2 border-white"></div>
                <div class="w-8 h-8 bg-indigo-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-between">
          <button (click)="prevStep()" class="btn-secondary">
            <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Retour
          </button>
          <button (click)="nextStep()" class="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-light">
            Finaliser
            <svg class="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Step 4: Ready to Start -->
      <div *ngIf="currentStep === 3" 
           class="text-center max-w-2xl animate-fade-in">
        <div class="mb-8">
          <div class="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 class="text-5xl font-bold text-white mb-4">Parfait !</h1>
          <p class="text-xl text-white/80 leading-relaxed mb-8">
            Vous êtes maintenant prêt à gérer vos projets comme un expert. 
            Créez votre premier projet et commencez votre aventure entrepreneuriale.
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button (click)="startUsingApp()" class="btn-primary text-lg px-8 py-4 rounded-md">
            <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Créer mon premier projet
          </button>
          <button (click)="prevStep()" class="btn-secondary text-lg px-8 py-4">
            Revoir les étapes
          </button>
        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {

  currentStep = 0;
  steps = [0, 1, 2, 3];
  @Output() createProject = new EventEmitter<void>();
  
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
  
  startUsingApp() {
    this.createProject.emit();
  }

}
