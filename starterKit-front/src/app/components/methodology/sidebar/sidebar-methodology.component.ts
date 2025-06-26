import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceStep } from '../../../models/workspace.types';
import { LoaderComponent } from '../../loader/loader.component';
import { Observable } from 'rxjs';
import { LoaderService } from '../../../services/loader.service';

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
          <div *ngFor="let step of steps" class="flex items-start">
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
      private loaderService: LoaderService
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
}