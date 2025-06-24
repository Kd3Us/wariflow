import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { OnboardingComponent } from '../onboarding/onboarding.component';
import { LoaderComponent } from '../loader/loader.component';
import { Project, ProjectStage } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { LoaderService } from '../../services/loader.service';
import { ChatbotService, ChatbotResponse } from '../../services/chatbot.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule, 
    ReactiveFormsModule,
    ProjectCardComponent, 
    ProjectFormComponent,
    AddUserModalComponent,
    OnboardingComponent,
    LoaderComponent
  ],
  template: `
    <app-loader *ngIf="isLoading$ | async"></app-loader>

    <ng-container
      *ngIf="ideeProjects.length === 0 && mvpProjects.length === 0 && tractionProjects.length === 0 && leveeProjects.length === 0 
      && !isCreatingFirstProject
      ; else elseBlock">
      <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
        <app-onboarding (createProject)="creatingFirstProject()"></app-onboarding>
      </div>
    </ng-container>

    <ng-template #elseBlock>
      <div class="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-semibold text-gray-800">Tableau de project</h1>
          
          <div class="flex items-center gap-3">
            <button
              (click)="openAIProjectForm()"
              class="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-md font-medium cursor-pointer transition-all hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl"
            >
              Générer par IA
            </button>
            
            <button
              (click)="openProjectForm()"
              class="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-light"
            >
              <span class="material-icons text-lg">add</span>
              Créer projet
            </button>
          </div>
        </div>
      
        <div class="flex gap-5 overflow-x-auto pb-4 h-full">
          <div class="flex-1 min-w-[300px] max-w-[350px] bg-gray-50 rounded-lg p-4 flex flex-col h-full">
            <div class="flex items-center mb-4">
              <h2 class="text-base font-semibold text-gray-700 m-0">{{ ProjectStage.IDEE }}</h2>
              <span class="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">{{ ideeProjects.length }}</span>
              <button
                (click)="openProjectForm(ProjectStage.IDEE)"
                class="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer transition-colors hover:bg-secondary hover:text-white"
              >
                <span class="material-icons text-lg">add</span>
              </button>
            </div>
      
            <div
              cdkDropList
              #ideeList="cdkDropList"
              [cdkDropListData]="ideeProjects"
              [cdkDropListConnectedTo]="[mvpList, tractionList, leveeList]"
              class="flex-grow overflow-y-auto min-h-[100px] p-1"
              (cdkDropListDropped)="drop($event)"
            >
              <app-project-card
                *ngFor="let project of ideeProjects"
                [project]="project"
                cdkDrag
                [cdkDragData]="project"
                class="mb-4"
                (edit)="editProject($event)"
                (delete)="deleteProject($event)"
                (addUsers)="onAddUsersClick($event)"
                (removeUser)="onRemoveUser($event)"
              ></app-project-card>
            </div>
          </div>

          <div class="flex-1 min-w-[300px] max-w-[350px] bg-gray-50 rounded-lg p-4 flex flex-col h-full">
            <div class="flex items-center mb-4">
              <h2 class="text-base font-semibold text-gray-700 m-0">{{ ProjectStage.MVP }}</h2>
              <span class="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">{{ mvpProjects.length }}</span>
              <button
                (click)="openProjectForm(ProjectStage.MVP)"
                class="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer transition-colors hover:bg-secondary hover:text-white"
              >
                <span class="material-icons text-lg">add</span>
              </button>
            </div>
      
            <div
              cdkDropList
              #mvpList="cdkDropList"
              [cdkDropListData]="mvpProjects"
              [cdkDropListConnectedTo]="[ideeList, tractionList, leveeList]"
              class="flex-grow overflow-y-auto min-h-[100px] p-1"
              (cdkDropListDropped)="drop($event)"
            >
              <app-project-card
                *ngFor="let project of mvpProjects"
                [project]="project"
                cdkDrag
                [cdkDragData]="project"
                class="mb-4"
                (edit)="editProject($event)"
                (delete)="deleteProject($event)"
                (addUsers)="onAddUsersClick($event)"
                (removeUser)="onRemoveUser($event)"
              ></app-project-card>
            </div>
          </div>

          <div class="flex-1 min-w-[300px] max-w-[350px] bg-gray-50 rounded-lg p-4 flex flex-col h-full">
            <div class="flex items-center mb-4">
              <h2 class="text-base font-semibold text-gray-700 m-0">{{ ProjectStage.TRACTION }}</h2>
              <span class="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">{{ tractionProjects.length }}</span>
              <button
                (click)="openProjectForm(ProjectStage.TRACTION)"
                class="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer transition-colors hover:bg-secondary hover:text-white"
              >
                <span class="material-icons text-lg">add</span>
              </button>
            </div>
      
            <div
              cdkDropList
              #tractionList="cdkDropList"
              [cdkDropListData]="tractionProjects"
              [cdkDropListConnectedTo]="[ideeList, mvpList, leveeList]"
              class="flex-grow overflow-y-auto min-h-[100px] p-1"
              (cdkDropListDropped)="drop($event)"
            >
              <app-project-card
                *ngFor="let project of tractionProjects"
                [project]="project"
                cdkDrag
                [cdkDragData]="project"
                class="mb-4"
                (edit)="editProject($event)"
                (delete)="deleteProject($event)"
                (addUsers)="onAddUsersClick($event)"
                (removeUser)="onRemoveUser($event)"
              ></app-project-card>
            </div>
          </div>

          <div class="flex-1 min-w-[300px] max-w-[350px] bg-gray-50 rounded-lg p-4 flex flex-col h-full">
            <div class="flex items-center mb-4">
              <h2 class="text-base font-semibold text-gray-700 m-0">{{ ProjectStage.LEVEE }}</h2>
              <span class="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">{{ leveeProjects.length }}</span>
              <button
                (click)="openProjectForm(ProjectStage.LEVEE)"
                class="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer transition-colors hover:bg-secondary hover:text-white"
              >
                <span class="material-icons text-lg">add</span>
              </button>
            </div>
      
            <div
              cdkDropList
              #leveeList="cdkDropList"
              [cdkDropListData]="leveeProjects"
              [cdkDropListConnectedTo]="[ideeList, mvpList, tractionList]"
              class="flex-grow overflow-y-auto min-h-[100px] p-1"
              (cdkDropListDropped)="drop($event)"
            >
              <app-project-card
                *ngFor="let project of leveeProjects"
                [project]="project"
                cdkDrag
                [cdkDragData]="project"
                class="mb-4"
                (edit)="editProject($event)"
                (delete)="deleteProject($event)"
                (addUsers)="onAddUsersClick($event)"
                (removeUser)="onRemoveUser($event)"
              ></app-project-card>
            </div>
          </div>
        </div>
      </div>
      
      <app-project-form
        *ngIf="showProjectForm"
        [project]="selectedProject"
        (save)="saveProject($event)"
        (cancel)="closeProjectForm()"
      ></app-project-form>

      <div *ngIf="showAiProjectModal" class="fixed inset-0 bg-black bg-opacity-50 z-50" (click)="closeAIProjectModal()">
        <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <h2 class="text-xl font-semibold text-gray-800 m-0">Générer un projet avec l'IA</h2>
            <button class="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" (click)="closeAIProjectModal()">
              <span class="material-icons">close</span>
            </button>
          </div>

          <form [formGroup]="aiForm" (ngSubmit)="onGenerate()" *ngIf="!isGenerating && !generationResult" class="p-6 space-y-6">
            <div class="space-y-2">
              <label for="description" class="block text-sm font-medium text-gray-700">Décrivez votre projet *</label>
              <textarea
                id="description"
                formControlName="description"
                placeholder="Ex: Je veux créer une application mobile de livraison de nourriture avec géolocalisation et paiement en ligne pour les étudiants universitaires..."
                rows="4"
                class="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              ></textarea>
              <div class="mt-1">
                <span class="text-xs" 
                      [class.text-red-500]="(aiForm.get('description')?.value?.length || 0) < 20"
                      [class.text-green-500]="(aiForm.get('description')?.value?.length || 0) >= 20">
                  {{ aiForm.get('description')?.value?.length || 0 }}/20 caractères minimum
                </span>
              </div>
              <div class="text-sm text-red-600 mt-1" *ngIf="aiForm.get('description')?.invalid && aiForm.get('description')?.touched">
                Description trop courte (minimum 20 caractères)
              </div>
            </div>

            <div class="space-y-2">
              <label for="context" class="block text-sm font-medium text-gray-700">Contexte ou contraintes (optionnel)</label>
              <input
                id="context"
                type="text"
                formControlName="context"
                placeholder="Ex: Budget 50k€, deadline 3 mois, équipe de 4 personnes..."
                class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
            </div>

            <div class="space-y-2">
              <label for="targetAudience" class="block text-sm font-medium text-gray-700">Public cible (optionnel)</label>
              <input
                id="targetAudience"
                type="text"
                formControlName="targetAudience"
                placeholder="Ex: Jeunes urbains 18-35 ans, entreprises B2B..."
                class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
            </div>

            <div class="flex justify-end gap-4 mt-8">
              <button type="button" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors" (click)="closeAIProjectModal()">
                Annuler
              </button>
              <button 
                type="submit" 
                class="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-md font-medium hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                [disabled]="aiForm.invalid"
              >
                Générer le projet
              </button>
            </div>
          </form>

          <div *ngIf="isGenerating" class="p-8 text-center">
            <div class="flex items-center justify-center space-x-4 mb-6">
              <div class="text-4xl animate-pulse">IA</div>
              <div class="flex space-x-1">
                <span class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0s;"></span>
                <span class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.3s;"></span>
                <span class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.6s;"></span>
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">L'IA analyse votre projet...</h3>
            <p class="text-gray-600">Génération des cartes en cours, veuillez patienter.</p>
          </div>

          <div *ngIf="generationResult && !isGenerating" class="p-6">
            <div class="flex items-center space-x-3 mb-6">
              <h3 class="text-lg font-semibold text-gray-800 m-0">Projet généré avec succès !</h3>
            </div>

            <div class="mb-6">
              <p class="text-gray-600 mb-4"><strong>{{ generationResult.projects.length }} cartes</strong> ont été créées automatiquement</p>
            </div>

            <div class="flex justify-end gap-4 mt-8">
              <button class="px-6 py-2 bg-secondary text-white rounded-md font-medium hover:bg-primary-light transition-colors" (click)="onProjectsGenerated()">
                Parfait ! Voir les projets
              </button>
            </div>
          </div>

          <div *ngIf="errorMessage" class="p-8 text-center">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Erreur lors de la génération</h3>
            <p class="text-gray-600 mb-6">{{ errorMessage }}</p>
            <div class="flex justify-end gap-4 mt-8">
              <button class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors" (click)="resetAIForm()">
                Réessayer
              </button>
              <button class="px-6 py-2 bg-secondary text-white rounded-md font-medium hover:bg-primary-light transition-colors" (click)="closeAIProjectModal()">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>

      <app-add-user-modal
        [isOpen]="isAddUserModalOpen"
        [currentTeamIds]="selectedProjectTeamIds"
        (close)="onCloseAddUserModal()"
        (userAdded)="onUsersAdded($event)"
      ></app-add-user-modal>
    </ng-template>
  `
})
export class KanbanBoardComponent implements OnInit {
  ProjectStage = ProjectStage;
  
  ideeProjects: Project[] = [];
  mvpProjects: Project[] = [];
  tractionProjects: Project[] = [];
  leveeProjects: Project[] = [];
  
  showProjectForm = false;
  showAiProjectModal = false;
  selectedProject: Project | null = null;
  isNewProject = false;
  isCreatingFirstProject = false;
  
  isAddUserModalOpen = false;
  selectedProjectId: string | null = null;
  
  isLoading$: Observable<boolean>;
  
  aiForm: FormGroup;
  isGenerating = false;
  generationResult: ChatbotResponse | null = null;
  errorMessage = '';

  constructor(
    private projectService: ProjectService,
    private loaderService: LoaderService,
    private chatbotService: ChatbotService,
    private fb: FormBuilder
  ) {
    this.isLoading$ = this.loaderService.isLoading$;
    
    this.aiForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(20)]],
      context: [''],
      targetAudience: ['']
    });
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.projectService.getProjects().subscribe(projects => {
      this.ideeProjects = projects.filter(p => p.stage === ProjectStage.IDEE);
      this.mvpProjects = projects.filter(p => p.stage === ProjectStage.MVP);
      this.tractionProjects = projects.filter(p => p.stage === ProjectStage.TRACTION);
      this.leveeProjects = projects.filter(p => p.stage === ProjectStage.LEVEE);
    });
  }

  creatingFirstProject(): void {
    this.isCreatingFirstProject = true;
    this.openProjectForm();
  }

  drop(event: CdkDragDrop<Project[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const project = event.container.data[event.currentIndex];
    
    let newStage: ProjectStage;
    if (event.container.data === this.ideeProjects) {
      newStage = ProjectStage.IDEE;
    } else if (event.container.data === this.mvpProjects) {
      newStage = ProjectStage.MVP;
    } else if (event.container.data === this.tractionProjects) {
      newStage = ProjectStage.TRACTION;
    } else if (event.container.data === this.leveeProjects) {
      newStage = ProjectStage.LEVEE;
    } else {
      return;
    }
    
    this.projectService.updateProjectStage(project.id, newStage).subscribe({
      next: (updatedProject) => {
        const index = event.container.data.findIndex(p => p.id === updatedProject.id);
        if (index !== -1) {
          event.container.data[index] = updatedProject;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de l\'étape:', error);
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex,
        );
      }
    });
  }

  openProjectForm(initialStage?: ProjectStage): void {
    this.selectedProject = null;
    this.isNewProject = true;
    this.showProjectForm = true;
  }

  openAIProjectForm(): void {
    console.log('🚀 Ouverture modal IA');
    this.showAiProjectModal = true;
  }

  closeAIProjectModal(): void {
    this.showAiProjectModal = false;
    this.resetAIForm();
  }

  onGenerate(): void {
    console.log('🔄 onGenerate appelé');
    console.log('Form valid:', this.aiForm.valid);
    console.log('Form value:', this.aiForm.value);
    
    if (this.aiForm.invalid) {
      console.log('❌ Formulaire invalide');
      return;
    }

    this.isGenerating = true;
    this.errorMessage = '';

    const formData = {
      description: this.aiForm.get('description')?.value || '',
      context: this.aiForm.get('context')?.value || '',
      targetAudience: this.aiForm.get('targetAudience')?.value || ''
    };

    console.log('📤 Envoi des données à l\'API:', formData);

    this.chatbotService.generateProject(formData).subscribe({
      next: (result) => {
        console.log('✅ Réponse API reçue:', result);
        this.isGenerating = false;
        this.generationResult = result;
      },
      error: (error) => {
        console.error('❌ Erreur API:', error);
        this.isGenerating = false;
        this.errorMessage = error.error?.message || 'Une erreur est survenue lors de la génération';
      }
    });
  }

  onProjectsGenerated(): void {
    console.log('🔄 Rechargement des projets après génération IA');
    this.loadProjects();
    this.closeAIProjectModal();
    setTimeout(() => {
      console.log('✅ Projets rechargés depuis l\'API');
    }, 500);
  }

  resetAIForm(): void {
    this.aiForm.reset();
    this.isGenerating = false;
    this.generationResult = null;
    this.errorMessage = '';
  }

  editProject(project: Project): void {
    this.selectedProject = project;
    this.isNewProject = false;
    this.showProjectForm = true;
  }

  deleteProject(project: Project): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
      this.projectService.deleteProject(project.id);
      this.loadProjects();
    }
  }

  saveProject(projectData: Partial<Project>): void {
    if (this.isNewProject) {
      this.projectService.addProject(projectData as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>);
    } else if (this.selectedProject) {
      const updatedProject = { ...this.selectedProject, ...projectData };
      this.projectService.updateProject(updatedProject);
    }
    this.closeProjectForm();
    setTimeout(() => this.loadProjects(), 100);
  }

  closeProjectForm(): void {
    this.showProjectForm = false;
    this.selectedProject = null;
  }

  onAddUsersClick(projectId: string): void {
    this.selectedProjectId = projectId;
    this.isAddUserModalOpen = true;
  }

  onCloseAddUserModal(): void {
    this.isAddUserModalOpen = false;
    this.selectedProjectId = null;
  }

  onUsersAdded(userIds: string[]): void {
    if (this.selectedProjectId) {
      this.projectService.addUsersToProject(this.selectedProjectId, userIds).subscribe({
        next: () => {
          this.loadProjects();
          this.onCloseAddUserModal();
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'ajout d\'utilisateurs:', error);
        }
      });
    }
  }

  onRemoveUser(data: { projectId: string, userId: string }): void {
    this.projectService.removeUserFromProject(data.projectId, data.userId).subscribe({
      next: () => {
        this.loadProjects();
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      }
    });
  }

  get selectedProjectTeamIds(): string[] {
    if (!this.selectedProjectId) return [];
    
    const allProjects = [...this.ideeProjects, ...this.mvpProjects, ...this.tractionProjects, ...this.leveeProjects];
    const project = allProjects.find(p => p.id === this.selectedProjectId);
    return project ? project.team.map(member => member.id) : [];
  }
}