import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SessionHistoryDashboardComponent } from '../../components/coaching/session-history-dashboard/session-history-dashboard.component';
import { SessionListComponent } from '../../components/coaching/session-list/session-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: SessionHistoryDashboardComponent,
    data: { 
      title: 'Tableau de Bord Coaching',
      description: 'Vue d\'ensemble de vos séances et progression'
    }
  },
  {
    path: 'sessions',
    component: SessionListComponent,
    data: { 
      title: 'Historique des Séances',
      description: 'Liste complète de vos séances de coaching'
    }
  },
  {
    path: 'sessions/:id',
    component: SessionListComponent,
    data: { 
      title: 'Détail de la Séance',
      description: 'Informations détaillées de la séance'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SessionHistoryRoutingModule { }