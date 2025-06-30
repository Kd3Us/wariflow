import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JwtService } from '../../services/jwt.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  user = {
    name: '',
    organisation: '',
    avatar: 'https://i.pravatar.cc/150?img=12' // Avatar par défaut
  };
  isMenuOpen = false;
  private tokenSubscription: Subscription | null = null;

  constructor(
    private jwtService: JwtService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile') && !target.closest('.custom-menu')) {
      this.isMenuOpen = false;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  ngOnInit() {
    // S'abonner aux changements du token
    this.tokenSubscription = this.jwtService.token$.subscribe(decodedToken => {
      if (decodedToken) {
        // Utilise le nom complet du token s'il existe
        this.user.name = decodedToken.name;
        const match = decodedToken?.sub.match(/@([^.]+)\./);
        const organisation = match ? match[1] : "";
        this.user.organisation = organisation.toUpperCase();
      } else {
        // Si pas de token, réinitialiser le nom
        this.user.name = '';
        this.user.organisation = '';
      }
    });

    // Forcer une mise à jour du token observable au cas où il serait déjà disponible
    // mais pas encore émis par le BehaviorSubject
    setTimeout(() => {
      this.jwtService.updateTokenObservable();
    }, 100);
  }

  ngOnDestroy() {
    // Nettoyer l'abonnement pour éviter les fuites mémoire
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  logout() {
    this.jwtService.removeToken();
    this.jwtService.redirectLoginPage();
  }
}
