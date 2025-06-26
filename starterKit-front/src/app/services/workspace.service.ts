import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkspaceStep, WorkspaceData, PersonForm, VisualIdentityForm, StorytellingForm, BusinessModelForm } from '../models/workspace.types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiWorkspaceURL;
  
  private readonly _currentStep = signal<number>(1);
  private readonly _workspaceData = signal<WorkspaceData>({
    personForm: new PersonForm(),
    visualIdentityForm: new VisualIdentityForm(),
    storytellingForm: new StorytellingForm(),
    businessModelForm: new BusinessModelForm(),
  });
  private readonly _workspaceId = signal<string | null>(null);
  private readonly _projectId = signal<string | null>(null);

  readonly currentStep = this._currentStep.asReadonly();
  readonly workspaceData = this._workspaceData.asReadonly();
  readonly workspaceId = this._workspaceId.asReadonly();

  readonly steps: WorkspaceStep[] = [
    { id: 1, title: 'Buyers Persona', completed: false, active: true },
    { id: 2, title: 'Branding', completed: false, active: false },
    { id: 3, title: 'Storytelling', completed: false, active: false },
    { id: 4, title: 'Business Model', completed: false, active: false }
  ];


  nextStep(): void {
    if (this._currentStep() < 4) {
      this._currentStep.update(step => step + 1);
      this.updateStepStatus();
    }
  }

  previousStep(): void {
    if (this._currentStep() > 1) {
      this._currentStep.update(step => step - 1);
      this.updateStepStatus();
    }
  }

  goToStep(stepNumber: number): void {
    if (stepNumber >= 1 && stepNumber <= 4) {
      this._currentStep.set(stepNumber);
      this.updateStepStatus();
    }
  }

  updateWorkspaceData<K extends keyof WorkspaceData>(key: K, value: WorkspaceData[K]): void {
    this._workspaceData.update(data => ({
      ...data,
      [key]: value
    }));
    
    // Sauvegarder automatiquement les données sur le backend
    this.saveWorkspaceData().subscribe({
      next: (workspace) => {
        if (!this._workspaceId()) {
          this._workspaceId.set(workspace.id);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde du workspace:', error);
      }
    });
  }

  // Créer un nouveau workspace
  createWorkspace(projectId?: string): Observable<any> {
    const workspaceData = {
      projectId,
      currentStep: this._currentStep(),
      personForm: this._workspaceData().personForm,
      visualIdentityForm: this._workspaceData().visualIdentityForm,
      storytellingForm: this._workspaceData().storytellingForm,
      businessModelForm: this._workspaceData().businessModelForm
    };

    return this.http.post(this.apiUrl, workspaceData);
  }

  // Sauvegarder les données du workspace
  saveWorkspaceData(): Observable<any> {
    const workspaceId = this._workspaceId();
    const workspaceData = {
      currentStep: this._currentStep(),
      personForm: this._workspaceData().personForm,
      visualIdentityForm: this._workspaceData().visualIdentityForm,
      storytellingForm: this._workspaceData().storytellingForm,
      businessModelForm: this._workspaceData().businessModelForm
    };

    if (workspaceId) {
      // Mettre à jour le workspace existant
      return this.http.patch(`${this.apiUrl}/${workspaceId}`, workspaceData);
    } else {
      // Créer un nouveau workspace
      const projectId = this._projectId();
      return this.createWorkspace(projectId || undefined);
    }
  }

  // Récupérer un workspace par ID
  getWorkspaceById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Récupérer un workspace
  getWorkspace(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }



  // Récupérer tous les workspaces
  getAllWorkspaces(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Charger les données d'un workspace spécifique dans le service
  loadWorkspaceById(workspaceId: string): void {
    this.getWorkspaceById(workspaceId).subscribe({
      next: (workspace) => {
        this._workspaceId.set(workspace.id);
        this._projectId.set(workspace.projectId);
        this._currentStep.set(workspace.currentStep || 1);
        
        this._workspaceData.set({
          personForm: workspace.personForm ? Object.assign(new PersonForm(), workspace.personForm) : new PersonForm(),
          visualIdentityForm: workspace.visualIdentityForm ? Object.assign(new VisualIdentityForm(), workspace.visualIdentityForm) : new VisualIdentityForm(),
          storytellingForm: workspace.storytellingForm ? Object.assign(new StorytellingForm(), workspace.storytellingForm) : new StorytellingForm(),
          businessModelForm: workspace.businessModelForm ? Object.assign(new BusinessModelForm(), workspace.businessModelForm) : new BusinessModelForm()
        });
        
        this.updateStepStatus();
      },
      error: (error) => {
        console.error('Erreur lors du chargement du workspace:', error);
      }
    });
  }

  // Charger les données d'un workspace dans le service
  loadWorkspaceFromData(workspace: any): void {
    this._workspaceId.set(workspace.id);
    this._projectId.set(workspace.projectId);
    this._currentStep.set(workspace.currentStep || 1);
    
    this._workspaceData.set({
      personForm: workspace.personForm ? Object.assign(new PersonForm(), workspace.personForm) : new PersonForm(),
      visualIdentityForm: workspace.visualIdentityForm ? Object.assign(new VisualIdentityForm(), workspace.visualIdentityForm) : new VisualIdentityForm(),
      storytellingForm: workspace.storytellingForm ? Object.assign(new StorytellingForm(), workspace.storytellingForm) : new StorytellingForm(),
      businessModelForm: workspace.businessModelForm ? Object.assign(new BusinessModelForm(), workspace.businessModelForm) : new BusinessModelForm()
    });
    
    this.updateStepStatus();
  }

  // Définir l'ID du projet
  setProjectId(projectId: string): void {
    this._projectId.set(projectId);
  }

  private updateStepStatus(): void {
    const currentStepNumber = this._currentStep();
    this.steps.forEach(step => {
      step.completed = step.id < currentStepNumber;
      step.active = step.id === currentStepNumber;
    });
  }

  getSteps(): WorkspaceStep[] {
    return [...this.steps];
  }
}
