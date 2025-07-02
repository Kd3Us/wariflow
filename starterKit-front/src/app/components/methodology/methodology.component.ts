import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SidebarMethodologyComponent } from './sidebar/sidebar-methodology.component';
import { Step1Component } from './step1/step1.component';
import { Step2Component } from './step2/step2.component';
import { Step3Component } from './step3/step3.component';
import { Step4Component } from './step4/step4.component';
import { WorkspaceService } from '../../services/workspace.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-methodology',
  standalone: true,
  imports: [CommonModule,
    SidebarMethodologyComponent,
    Step1Component,
    Step2Component,
    Step3Component,
    Step4Component
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      
      <div class="flex h-screen">
        <app-sidebar 
          [steps]="steps()" 
          [currentStep]="currentStep()">
        </app-sidebar>
        
        <main class="flex-1 overflow-y-auto">
          <div class="max-w-4xl mx-auto p-8 pb-16">
            <app-step1 *ngIf="currentStep() === 1"></app-step1>
            <app-step2 *ngIf="currentStep() === 2"></app-step2>
            <app-step3 *ngIf="currentStep() === 3"></app-step3>
            <app-step4 *ngIf="currentStep() === 4"></app-step4>
          </div>
        </main>
      </div>
    </div>
    `
})
export class MethodologyComponent implements OnInit {

  private workspaceService = inject(WorkspaceService);
  
  currentStep = this.workspaceService.currentStep;
  steps = computed(() => this.workspaceService.getSteps());

  constructor(
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    this.loaderService.startLoading();
      // récupérer tous les workspaces et charger le premier disponible
      this.workspaceService.getAllWorkspaces().subscribe({
        next: (workspaces) => {
          if (workspaces && workspaces.length > 0) {
            // Charger le premier workspace disponible
            const firstWorkspace = workspaces[0];
            this.workspaceService.loadWorkspaceFromData(firstWorkspace);
          } else {
            // Si aucun workspace n'existe, créer un nouveau workspace
            this.workspaceService.createWorkspace().subscribe({
              next: (workspace) => {
                console.log('Nouveau workspace créé:', workspace);
                this.workspaceService.loadWorkspaceFromData(workspace);
              },
              error: (error) => {
                console.error('Erreur lors de la création du workspace:', error);
              }
            });
          }
          this.loaderService.stopLoading()
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des workspaces:', error);
          // En cas d'erreur, créer un nouveau workspace
          this.workspaceService.createWorkspace().subscribe({
            next: (workspace) => {
              console.log('Nouveau workspace créé après erreur:', workspace);
              this.workspaceService.loadWorkspaceFromData(workspace);
            },
            error: (createError) => {
              console.error('Erreur lors de la création du workspace:', createError);
            }
          });
          this.loaderService.stopLoading();
        }
      });
    
  }
}
