# Documentation API Workspace

## Vue d'ensemble

Le système de workspace permet de sauvegarder et récupérer automatiquement les données de méthodologie (PersonForm, VisualIdentityForm, StorytellingForm, BusinessModelForm) entre le frontend et le backend.

## Backend

### Endpoints disponibles

- `POST /workspaces` - Créer un nouveau workspace
- `GET /workspaces` - Récupérer tous les workspaces
- `GET /workspaces/:id` - Récupérer un workspace par ID
- `GET /workspaces/project/:projectId` - Récupérer un workspace par ID de projet
- `PATCH /workspaces/:id` - Mettre à jour un workspace
- `DELETE /workspaces/:id` - Supprimer un workspace

### Structure des données

```typescript
interface Workspace {
  id: string;
  projectId?: string;
  currentStep: number;
  personForm: {
    nom: string;
    prenom: string;
    sexe: string;
    age: number | null;
    nationalite: string;
    origine: string;
    description: string;
    parcoursUtilisateur: string;
  };
  visualIdentityForm: {
    slogan: string;
    typography: string;
    valeurs: string;
    tonMessage: string;
    experienceUtilisateur: string;
  };
  storytellingForm: {
    archetypes: string[];
    structureNarrative: string;
    pitch: string;
  };
  businessModelForm: {
    market: string;
    pricing: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Frontend

### Service WorkspaceService

Le service a été étendu avec les nouvelles méthodes suivantes :

#### Méthodes principales

- `updateWorkspaceData<K extends keyof WorkspaceData>(key: K, value: WorkspaceData[K])` - Met à jour les données et les sauvegarde automatiquement sur le backend
- `loadWorkspaceData(workspaceId: string)` - Charge les données d'un workspace depuis le backend
- `setProjectId(projectId: string)` - Définit l'ID du projet courant

#### Méthodes API

- `createWorkspace(projectId?: string): Observable<any>` - Crée un nouveau workspace
- `saveWorkspaceData(): Observable<any>` - Sauvegarde les données actuelles
- `getWorkspace(id: string): Observable<any>` - Récupère un workspace par ID

### Utilisation

#### 1. Sauvegarde automatique

Chaque fois que vous appelez `updateWorkspaceData`, les données sont automatiquement sauvegardées sur le backend :

```typescript
// Dans un composant
this.workspaceService.updateWorkspaceData('personForm', formData);
// Les données sont automatiquement sauvegardées sur le backend
```

#### 3. Chargement des données par ID de workspace

```typescript
// Charger les données d'un workspace spécifique
this.workspaceService.loadWorkspaceData('workspace-456');
```

#### 4. Définir l'ID du projet

```typescript
// Définir l'ID du projet pour les futures sauvegardes
this.workspaceService.setProjectId('project-123');
```

### Exemple d'intégration dans un composant

#### MethodologyComponent (composant principal)

```typescript
export class MethodologyComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  
  ngOnInit(): void {

    this.projectService.getProjects().subscribe(projects => {
      if (projects && projects.length > 0) {
        const firstProject = projects[0];
        this.workspaceService.loadWorkspaceByProjectId(firstProject.id);
      } else {
        // Si aucun projet n'est disponible, créer un workspace sans projet
        this.workspaceService.createWorkspace().subscribe({
          next: (workspace) => console.log('Nouveau workspace créé:', workspace),
          error: (error) => console.error('Erreur lors de la création du workspace:', error)
        });
      }
    });
  }
}
```

#### Step1Component (composant de formulaire)

```typescript
export class Step1Component implements OnInit {
  private workspaceService = inject(WorkspaceService);
  
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
    }
  }

  private loadFormData(personForm: PersonForm): void {
    this.profileForm.patchValue({
      nom: personForm.nom || '',
      prenom: personForm.prenom || '',
      // ... autres champs
    });
  }
  
  saveAndContinue(): void {
    if (this.profileForm.valid) {
      // Les données sont automatiquement sauvegardées
      this.workspaceService.updateWorkspaceData('personForm', this.profileForm.value as PersonForm);
      this.workspaceService.nextStep();
    }
  }
}
```

## Configuration

### Environnement

Assurez-vous que l'URL de l'API workspace est configurée dans vos fichiers d'environnement :

```typescript
// environment.ts
export const environment = {
  apiWorkspaceURL: 'http://localhost:3009/workspaces',
  // autres configurations...
};
```

## Gestion des erreurs

Le service gère automatiquement les erreurs et les affiche dans la console. En cas d'erreur lors du chargement d'un workspace par projet (404), un nouveau workspace est automatiquement créé.

## Notes importantes

1. **Sauvegarde automatique** : Chaque appel à `updateWorkspaceData` déclenche une sauvegarde sur le backend
2. **Création automatique** : Si aucun workspace n'existe pour un projet, il est créé automatiquement
3. **Gestion des états** : Le service maintient l'état local et synchronise avec le backend
4. **TypeScript** : Toutes les méthodes sont typées pour une meilleure sécurité de type
