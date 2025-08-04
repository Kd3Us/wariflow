import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { SessionHistoryRoutingModule } from './session-history-routing.module';
import { SessionHistoryService } from '../../services/session-history.service';

@NgModule({
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
  ]
})
export class SessionHistoryModule { }