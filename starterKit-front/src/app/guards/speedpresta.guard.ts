import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { JwtService } from '../services/jwt.service';
import { map, catchError, of, tap } from 'rxjs';
import { EmbedService } from '../services/embed.service';

export const speedprestaGuard: CanActivateFn = (route, state) => {
  const jwtService = inject(JwtService);
  const embedService = inject(EmbedService);
  const router = inject(Router);

  return jwtService.checkTokenAndRedirect().pipe(
    tap(isValid => console.log('SpeedprestaGuard - Token validity:', isValid)),
    map(isValid => {
      if (!isValid) {
        return false;
      }

      // Décoder le token pour vérifier le champ sub
      const decodedToken = jwtService.decodeToken();
      
      if (!decodedToken || !decodedToken.sub) {
        // Rediriger vers une page d'accès refusé ou la page d'accueil
        router.navigate(['/']);
        return false;
      }

      // Vérifier si le sub contient "speedpresta"
      const hasSpeedpresta = decodedToken.sub.toLowerCase().includes('speedpresta');
      
      if (!hasSpeedpresta) {

        // check si mode embed
        const embedIsSet = embedService.getEmbedFromUrl();
        if (embedIsSet) {
          return true;
        }
        // Rediriger vers une page d'accès refusé ou la page d'accueil
        router.navigate(['/']);
        return false;
      }
      return true;
    }),
    catchError((error) => {
      router.navigate(['/']);
      return of(false);
    })
  );
};
