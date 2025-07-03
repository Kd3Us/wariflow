import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { EmbedService } from './services/embed.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, CommonModule],
  template: `
    <div class="flex w-full h-screen overflow-hidden">
      <app-sidebar/>
      <main class="flex-1 flex flex-col overflow-hidden" [ngClass]="{'ml-0': isEmbedRoute}">
        <app-header *ngIf="!isEmbedRoute" />
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent implements OnInit {
  title = 'starter-kit';
  isEmbedRoute = false;

  constructor(private embedService: EmbedService) {}

  ngOnInit() {
    this.embedService.embed$.subscribe(res => {
      if (res) {
        this.isEmbedRoute = res;
      }
    });
  }
}
