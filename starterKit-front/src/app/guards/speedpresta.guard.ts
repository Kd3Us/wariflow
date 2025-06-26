import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { JwtService } from '../services/jwt.service';
import { map, catchError, of, tap } from 'rxjs';

export const speedprestaGuard: CanActivateFn = (route, state) => {
  const jwtService = inject(JwtService);
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
