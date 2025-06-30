import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { JwtService } from '../../services/jwt.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit, OnDestroy {

    private tokenSubscription: Subscription | null = null;
    decodedToken: any;

    constructor(
      private jwtService: JwtService
    ) {}


  ngOnInit(): void {
    this.decodedToken = this.jwtService.decodeToken();
  }
    
  ngOnDestroy(): void {
        // Nettoyer l'abonnement pour éviter les fuites mémoire
        if (this.tokenSubscription) {
          this.tokenSubscription.unsubscribe();
        }
  }
}