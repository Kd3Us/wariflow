import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="flex w-full h-screen overflow-hidden">
      <app-sidebar />
      <main class="flex-1 flex flex-col overflow-hidden">
        <app-header />
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  title = 'angular-kanban';
}