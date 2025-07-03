import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { JwtService } from '../services/jwt.service';

// Variable globale pour éviter les redirections multiples
let isRedirecting = false;

/**
 * Interceptor JWT fonctionnel pour Angular 17+
 */
export const jwtInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const jwtService = inject(JwtService);
  
  console.log('JwtInterceptor: Intercepting request to:', request.url);
  
  // Liste des URLs à exclure de l'interception
  const excludedUrls = [
    '/auth/verify',
    '/auth/login',
    '/auth/logout',
    '/auth/refresh'
  ];

  // Ne pas intercepter les requêtes d'authentification
  if (excludedUrls.some(url => request.url.includes(url))) {
    console.log('JwtInterceptor: Skipping auth request');
    return next(request);
  }

  const token = jwtService.getToken();
  console.log('JwtInterceptor: Token found:', !!token);
  
  // Si pas de token, rediriger vers la page de login
  if (!token) {
    console.log('JwtInterceptor: No token found, redirecting to login');
    handleUnauthorized(jwtService);
    return throwError(() => new Error('No token found'));
  }

  // Ajouter le token à la requête
  const modifiedRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log('JwtInterceptor: Token added to request headers');

  // Continuer avec la requête modifiée et gérer les erreurs
  return next(modifiedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('JwtInterceptor: HTTP Error:', error.status, error.message);
      
      // Gestion spécifique des erreurs 401
      if (error.status === 401) {
        console.log('JwtInterceptor: 401 Unauthorized - Token expired or invalid');
        handle401Error(error, jwtService);
      }
      
      // Gestion des autres erreurs d'authentification
      if (error.status === 403) {
        console.log('JwtInterceptor: 403 Forbidden - Insufficient permissions');
      }

      return throwError(() => error);
    })
  );
};

/**
 * Gère les erreurs 401 (Unauthorized)
 * @param error HttpErrorResponse
 * @param jwtService JwtService
 */
function handle401Error(error: HttpErrorResponse, jwtService: JwtService): void {
  console.log('JwtInterceptor: Handling 401 error');
  
  // Vérifier le message d'erreur pour plus de contexte
  if (error.error?.message) {
    console.log('JwtInterceptor: Error message:', error.error.message);
  }

  // Nettoyer le token et rediriger
  handleUnauthorized(jwtService);
}

/**
 * Gère les cas d'accès non autorisé
 * @param jwtService JwtService
 */
function handleUnauthorized(jwtService: JwtService): void {
  // Éviter les redirections multiples
  if (isRedirecting) {
    console.log('JwtInterceptor: Already redirecting, skipping');
    return;
  }

  isRedirecting = true;
  console.log('JwtInterceptor: Removing token and redirecting to login');
  
  // Supprimer le token
  jwtService.removeToken();
  
  // Utiliser setTimeout pour éviter les problèmes de cycle de vie Angular
  setTimeout(() => {
    jwtService.redirectLoginPage();
    // Reset du flag après redirection
    setTimeout(() => {
      isRedirecting = false;
    }, 1000);
  }, 100);
}

// Maintenir la classe pour la compatibilité si nécessaire
export class JwtInterceptor {
  // Cette classe est conservée pour la compatibilité
  // mais l'interceptor fonctionnel est recommandé
}
