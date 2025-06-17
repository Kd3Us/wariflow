import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { JwtService } from '../services/jwt.service';
import { map, catchError, of, tap } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  console.log('AuthGuard activated for route:', state.url);
  const jwtService = inject(JwtService);
  const router = inject(Router);


  // disable jwt check
  return of(true);

  /*return jwtService.checkTokenAndRedirect().pipe(
    tap(isValid => console.log('AuthGuard received verification result:', isValid)),
    catchError((error) => {
      console.error('AuthGuard caught error during token verification:', error);
      jwtService.removeToken();
      jwtService.redirectLoginPage();
      return of(false);
    })
  );*/
}; 