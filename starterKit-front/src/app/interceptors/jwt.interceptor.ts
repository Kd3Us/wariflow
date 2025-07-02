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
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    throw new Error('Method not implemented.');
  }

  /*intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Ne pas intercepter les requêtes d'authentification
    if (request.url.includes('/auth/verify')) {
      return next.handle(request);
    }

    
    const token = this.jwtService.getToken();
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

    // Vérifier le token avec l'API avant de continuer
    return this.jwtService.verifyTokenWithApi().pipe(
      switchMap(isValid => {
        if (!isValid) {
          console.log('JwtInterceptor: Token invalid according to API, redirecting to login');
          this.jwtService.removeToken();
          this.jwtService.redirectLoginPage();
          return throwError(() => new Error('Token invalid'));
        }
        // Token valide, continuer avec la requête
        return next.handle(modifiedRequest);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.log('JwtInterceptor: 401 Unauthorized, redirecting to login');
          this.jwtService.removeToken();
          this.jwtService.redirectLoginPage();
        }
        return throwError(() => error);
      })
    );
  }*/
} 