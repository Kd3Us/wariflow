import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { JwtService } from '../services/jwt.service';
import { map, catchError, of, tap } from 'rxjs';
import { EmbedService } from '../services/embed.service';

/**
 * Vérifie si le token est présent et non expiré localement
 * @param jwtService - Service JWT
 * @returns boolean - true si le token est valide localement
 */
function isTokenValidLocally(jwtService: JwtService, embedService: EmbedService): boolean {
  const token = jwtService.getToken();
  if (!token) {
    console.log('No token found in session storage');
    return false;
  }

  const decodedToken = jwtService.decodeToken();
  if (!decodedToken) {
    console.log('Token could not be decoded');
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const isExpired = decodedToken.exp < currentTime;
  
  if (isExpired) {
    console.log('Token is expired locally', {
      exp: decodedToken.exp,
      current: currentTime,
      expired: isExpired
    });
    return false;
  }
  checkEnableEmbed(embedService);
  console.log('Token is valid locally');
  return true;
}

function checkEnableEmbed(embedService:EmbedService): void {
  const embedIsSet = embedService.getEmbedFromUrl();
  if (embedIsSet) {
    embedService.setEmbed(true);
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const jwtService = inject(JwtService);
  const embedService = inject(EmbedService);

  // Vérifier d'abord si le token est valide localement
  if (!isTokenValidLocally(jwtService, embedService)) {
    console.log('AuthGuard: Token not valid locally, checking with API');
    // Si le token n'est pas valide localement, faire appel à l'API
    return jwtService.checkTokenAndRedirect().pipe(
      tap(isValid => console.log('AuthGuard received verification result from API:', isValid)),
      map(isValid => {
        if (!isValid) {
          console.log('AuthGuard: Token invalid, redirecting to login');
          // Redirection immédiate sans setTimeout
          jwtService.redirectLoginPage();
          return false;
        }

        console.log('AuthGuard: Token valid, allowing access');
        checkEnableEmbed(embedService);
        return true;
      }),
      catchError((error) => {
        console.error('AuthGuard caught error during token verification:', error);
        console.log('AuthGuard: Error occurred, removing token and redirecting');
        jwtService.removeToken();
        // Redirection immédiate sans setTimeout
        jwtService.redirectLoginPage();
        return of(false);
      })
    );
  }

  console.log('AuthGuard: Token valid locally, allowing access');
  // Si le token est valide localement, on peut directement retourner true
  return of(true);
};
