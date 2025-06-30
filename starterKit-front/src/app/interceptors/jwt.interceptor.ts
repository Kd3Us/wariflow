import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError } from 'rxjs';
import { JwtService } from '../services/jwt.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private jwtService: JwtService) {}
  /*intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    throw new Error('Method not implemented.');
  }*/

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('JwtInterceptor: Intercepting request to:', request.url);
    
    // Ne pas intercepter les requêtes d'authentification et de vérification
    if (request.url.includes('/auth/verify') || request.url.includes('/auth/login')) {
      console.log('JwtInterceptor: Skipping auth request');
      return next.handle(request);
    }

    const token = this.jwtService.getToken();
    console.log('JwtInterceptor: Token found:', !!token);
    
    if (!token) {
      console.log('JwtInterceptor: No token found, redirecting to login');
      this.jwtService.redirectLoginPage();
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
    return next.handle(modifiedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('JwtInterceptor: HTTP Error:', error.status, error.message);
        if (error.status === 401) {
          console.log('JwtInterceptor: 401 Unauthorized, removing token and redirecting to login');
          this.jwtService.removeToken();
          this.jwtService.redirectLoginPage();
        }
        return throwError(() => error);
      })
    );
  }
}
