import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ProjectService } from '../../services/project.service';
import { LoaderService } from '../../services/loader.service';
import { Project, ProjectStage } from '../../models/project.model';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { AiProjectModalComponent } from '../ai-project-modal/ai-project-modal.component';
import { OnboardingComponent } from '../onboarding/onboarding.component';
import { LoaderComponent } from '../loader/loader.component';
import { AddUserModalComponent } from '../add-user-modal/add-user-modal.component';
import { Observable } from 'rxjs';
import { ChatbotResponse } from '../../services/chatbot.service';
import { TeamMember } from '../../services/teams.service';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule, 
    DragDropModule, 
    ProjectCardComponent, 
    ProjectFormComponent, 
    AiProjectModalComponent,
    OnboardingComponent, 
    LoaderComponent, 
    AddUserModalComponent
  ],
  templateUrl: './kanban-board.component.html'
})
export class KanbanBoardComponent implements OnInit {
  ProjectStage = ProjectStage;
  ideeProjects: Project[] = [];
  mvpProjects: Project[] = [];
  tractionProjects: Project[] = [];
  leveeProjects: Project[] = [];
  
  selectedProject: Project | null = null;
  showProjectForm = false;
  showAiProjectModal = false;
  isNewProject = true;
  isCreatingFirstProject = false;
  
  isAddUserModalOpen = false;
  selectedProjectId: string | null = null;
  
  isLoading$: Observable<boolean>;
  
  constructor(
    private projectService: ProjectService,
    private loaderService: LoaderService
  ) {
    this.isLoading$ = this.loaderService.isLoading$;
  }
  
  ngOnInit(): void {
    this.loadProjects();
  }
  
  loadProjects(): void {
    console.log('[DEBUG] Chargement des projets...');
    this.projectService.getProjects().subscribe(projects => {
      
      this.ideeProjects = projects.filter(p => p.stage === ProjectStage.IDEE);
      this.mvpProjects = projects.filter(p => p.stage === ProjectStage.MVP);
      this.tractionProjects = projects.filter(p => p.stage === ProjectStage.TRACTION);
      this.leveeProjects = projects.filter(p => p.stage === ProjectStage.LEVEE);
      
      console.log('[DEBUG] Répartition:');
      console.log('- IDEE:', this.ideeProjects.length);
      console.log('- MVP:', this.mvpProjects.length);  
      console.log('- TRACTION:', this.tractionProjects.length);
      console.log('- LEVEE:', this.leveeProjects.length);
    });
  }
  
  drop(event: CdkDragDrop<Project[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
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
      
      project.stage = newStage;
      
      this.projectService.updateProjectStage(project.id, newStage).subscribe(() => {
        this.loadProjects();
      });
    }
  }

  creatingFirstProject() {
    this.isCreatingFirstProject = true;
    this.openProjectForm();
  }
  
  openProjectForm(stage: ProjectStage = ProjectStage.IDEE): void {
    this.isNewProject = true;
    this.selectedProject = null;
    this.showProjectForm = true;
  }

  openAIProjectForm(): void {
    this.showAiProjectModal = true;
  }

  closeAIProjectModal(): void {
    this.showAiProjectModal = false;
  }

  onProjectsGenerated(result: ChatbotResponse): void {
    console.log('[DEBUG] onProjectsGenerated appelé avec:', result);
    this.closeAIProjectModal();
    this.projectService.refreshProjects();
    
    setTimeout(() => {
      console.log('[DEBUG] Rechargement DIRECT depuis API...');
      
      // Appel API direct au lieu du BehaviorSubject
      this.projectService['http'].get<any[]>(this.projectService['apiUrl'] + '/my-organisation', { 
        headers: this.projectService['getAuthHeaders']() 
      }).subscribe(projects => {
        console.log('[DEBUG] Projets reçus directement de l\'API:', projects);
        
        const formattedProjects = projects.map(project => ({
          ...project,
          deadline: project.deadline ? new Date(project.deadline) : undefined,
          reminderDate: project.reminderDate ? new Date(project.reminderDate) : undefined,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }));
        
        this.ideeProjects = formattedProjects.filter(p => p.stage === ProjectStage.IDEE);
        this.mvpProjects = formattedProjects.filter(p => p.stage === ProjectStage.MVP);
        this.tractionProjects = formattedProjects.filter(p => p.stage === ProjectStage.TRACTION);
        this.leveeProjects = formattedProjects.filter(p => p.stage === ProjectStage.LEVEE);
        
        console.log('[DEBUG] Répartition DIRECTE:');
        console.log('- IDEE:', this.ideeProjects.length);
        console.log('- MVP:', this.mvpProjects.length);
        console.log('- TRACTION:', this.tractionProjects.length);
        console.log('- LEVEE:', this.leveeProjects.length);
        
        if (result && result.projects && result.projects.length > 0) {
          //alert(`${result.projects.length} projet(s) créé(s) avec succès !`);
        }
      });
      
    }, 1000);
  }
  
  editProject(project: Project): void {
    this.isNewProject = false;
    this.selectedProject = project;
    this.showProjectForm = true;
  }
  
  deleteProject(project: Project): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
      this.projectService.deleteProject(project.id);
      this.loadProjects();
    }
  }
  
  closeProjectForm(): void {
    this.showProjectForm = false;
    this.selectedProject = null;
  }
  
  saveProject(projectData: Partial<Project>): void {
    if (this.isNewProject) {
      this.projectService.addProject(projectData as any);
    } else if (this.selectedProject) {
      // Fusionner les données existantes avec les nouvelles données
      const updatedProject: Project = {
        ...this.selectedProject,
        ...projectData
      };
      
      console.log('Sauvegarde du projet avec toutes les données:', updatedProject);
      this.projectService.updateProject(updatedProject);
    }
    this.closeProjectForm();
    setTimeout(() => this.loadProjects(), 100);
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

  onTeamCreated(newTeamMember: TeamMember): void {
    console.log('Nouveau membre d\'équipe créé:', newTeamMember);
    // Optionnel: afficher une notification de succès
    // Vous pouvez ajouter ici une logique pour afficher une notification
    // Le modal se chargera automatiquement de recharger la liste des utilisateurs
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
