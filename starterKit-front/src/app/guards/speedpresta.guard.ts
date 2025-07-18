import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { JwtService } from '../services/jwt.service';
import { map, catchError, of, tap } from 'rxjs';
import { EmbedService } from '../services/embed.service';

export const speedprestaGuard: CanActivateFn = (route, state) => {
  const jwtService = inject(JwtService);
  const embedService = inject(EmbedService);
  const router = inject(Router);

  // Vérifier d'abord si c'est en mode embed
  const embedIsSet = embedService.getEmbedFromUrl();
  if (embedIsSet) {
    embedService.setEmbed(true);
    return of(true);
  }

  // next refresh
  if (embedService.getEmbed()) {
    return of(true);
  }

  return jwtService.checkTokenAndRedirect().pipe(
    tap(isValid => console.log('SpeedprestaGuard - Token validity:', isValid)),
    map(isValid => {
      if (!isValid) {
        console.log('SpeedprestaGuard: Token invalid, redirecting to login');
        jwtService.redirectLoginPage();
        return false;
      }

      // Décoder le token pour vérifier le champ sub
      const decodedToken = jwtService.decodeToken();
      
      if (!decodedToken || !decodedToken.sub) {
        console.log('SpeedprestaGuard: No token or sub field, redirecting to home');
        router.navigate(['/']);
        return false;
      }

      // Vérifier si le sub contient "speedpresta"
      const hasSpeedpresta = decodedToken.sub.toLowerCase().includes('speedpresta');
      
      if (!hasSpeedpresta) {
        router.navigate(['/']);
        return false;
      }
      
      console.log('SpeedprestaGuard: Access granted');
      return true;
    }),
    catchError((error) => {
      console.error('SpeedprestaGuard: Error occurred:', error);
      router.navigate(['/']);
      return of(false);
    })
  );
};
