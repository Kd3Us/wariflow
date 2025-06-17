import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JwtService } from '../../services/jwt.service';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
export class HeaderComponent implements OnInit {
  user = {
    name: '',
    avatar: 'https://i.pravatar.cc/150?img=12' // Avatar par défaut
  };
  isMenuOpen = false;

  constructor(
    private jwtService: JwtService,
    private router: Router
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
    const decodedToken = this.jwtService.decodeToken();
    if (decodedToken) {
      // Utilise le nom complet du token s'il existe
      this.user.name = decodedToken.name;
    }
  }

  logout() {
    this.jwtService.removeToken();
    this.jwtService.checkTokenAndRedirect();
  }
}