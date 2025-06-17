import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'kanban',
    pathMatch: 'full'
  },
  {
    path: 'kanban',
    loadComponent: () => import('./components/kanban-board/kanban-board.component').then(m => m.KanbanBoardComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'kanban'
  }
]; 