import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { speedprestaGuard } from './guards/speedpresta.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'kanban',
    pathMatch: 'full'
  },
  {
    path: 'kanban',
    loadComponent: () => import('./components/kanban-board/kanban-board.component').then(m => m.KanbanBoardComponent),
    canActivate: [speedprestaGuard]
  },
  {
    path: 'methodology',
    loadComponent: () => import('./components/methodology/methodology.component').then(m => m.MethodologyComponent),
    canActivate: [authGuard]
  },
  {
    path: 'project-management',
    loadComponent: () => import('./components/project-management-board/project-management-board.component').then(m => m.ProjectManagementBoardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'coaching',
    loadComponent: () => import('./components/coaching/coach-manager.component').then(m => m.CoachManagerComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'kanban'
  }
];