import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { SessionHistoryRoutingModule } from './session-history-routing.module';

import { SessionHistoryDashboardComponent } from '../../components/coaching/session-history-dashboard/session-history-dashboard.component';
import { SessionListComponent } from '../../components/coaching/session-list/session-list.component';
import { FeedbackModalComponent } from '../../components/coaching/feedback-modal/feedback-modal.component';
import { DocumentUploadComponent } from '../../components/coaching/document-upload/document-upload.component';

import { SessionHistoryService } from '../../services/session-history.service';

@NgModule({
  declarations: [
    SessionHistoryDashboardComponent,
    SessionListComponent,
    FeedbackModalComponent,
    DocumentUploadComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    SessionHistoryRoutingModule
  ],
  providers: [
    SessionHistoryService
  ],
  exports: [
    SessionHistoryDashboardComponent,
    SessionListComponent,
    FeedbackModalComponent,
    DocumentUploadComponent
  ]
})
export class SessionHistoryModule { }