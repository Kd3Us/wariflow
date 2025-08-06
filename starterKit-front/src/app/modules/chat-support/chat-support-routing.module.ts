import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatSupportComponent } from '../../components/coaching/chat-support/chat-support.component';

const routes: Routes = [
  {
    path: '',
    component: ChatSupportComponent,
    data: { 
      title: 'Support Chat',
      description: 'Chat de support avec assistance virtuelle et coaches'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatSupportRoutingModule { }