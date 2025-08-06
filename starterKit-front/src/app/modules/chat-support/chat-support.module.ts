import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { ChatSupportRoutingModule } from './chat-support-routing.module';
import { ChatSupportComponent } from '../../components/coaching/chat-support/chat-support.component';
import { ChatSupportService } from '../../services/chat-support.service';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    ChatSupportRoutingModule,
    ChatSupportComponent
  ],
  providers: [
    ChatSupportService
  ]
})
export class ChatSupportModule { }