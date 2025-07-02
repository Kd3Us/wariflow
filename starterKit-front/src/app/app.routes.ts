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
    loadComponent: () => import('./components/kanban-board/kanban-board.component').then(m => m.KanbanBoardComponent)
    // GUARDS DÉSACTIVÉS POUR LE DÉVELOPPEMENT
    // canActivate: [speedprestaGuard]
  },
  {
    path: 'methodology',
    loadComponent: () => import('./components/methodology/methodology.component').then(m => m.MethodologyComponent)
    // GUARDS DÉSACTIVÉS POUR LE DÉVELOPPEMENT
    // canActivate: [authGuard]
  },
  {
    path: 'project-management',
    loadComponent: () => import('./components/project-management-board/project-management-board.component').then(m => m.ProjectManagementBoardComponent)
    // GUARDS DÉSACTIVÉS POUR LE DÉVELOPPEMENT
    // canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'kanban'
  }
];