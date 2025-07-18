import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, BehaviorSubject, Subscription, catchError, of } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface VerifyTokenResponse {
  success: boolean;
  message: string;
  token: string;
}

interface DecodedToken {
  sub: string;
  name: string;
  iat: number;
  exp: number;
  apikey: string;
  [key: string]: any;
  organization: string;
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  private readonly EXTERNAL_AUTH_URL = environment.externaleAuthUrl;
  private readonly VERIFY_TOKEN_URL = environment.verifyTokenUrl;
  private readonly VERSION_NUMBER = environment.versionNumber;
  private readonly LOGOUT_URL = environment.revokeTokenUrl;
  
  // BehaviorSubject pour observer les changements du token
  private tokenSubject = new BehaviorSubject<DecodedToken | null>(null);
  
  // Observable public pour que les composants puissent s'abonner
  public token$ = this.tokenSubject.asObservable();
  
  // Flag pour éviter les vérifications multiples
  private hasCheckedUrl = false;

  constructor(private http: HttpClient) {
    console.log('initialized with :', {
      verifyTokenUrl: this.VERIFY_TOKEN_URL,
      externalAuthUrl: this.EXTERNAL_AUTH_URL,
      version: this.VERSION_NUMBER
    });
    
    // Initialiser le token au démarrage
    this.initializeToken();
  }

  /**
   * Initialise le token au démarrage du service
   * Vérifie d'abord l'URL, puis le sessionStorage
   */
  private initializeToken(): void {
    
    // Vérifier d'abord s'il y a un token dans l'URL
    const tokenFromUrl = this.getTokenFromUrl();
    if (tokenFromUrl) {
      this.setToken(tokenFromUrl);
      // Marquer comme vérifié pour éviter les vérifications répétitives
      this.hasCheckedUrl = true;
      return;
    }
    
    // Sinon, vérifier le sessionStorage
    const decodedToken = this.decodeToken();
    if (decodedToken) {
      this.tokenSubject.next(decodedToken);
    } else {
      this.tokenSubject.next(null);
    }
  }

  /**
   * Vérifie si le token JWT est valide en appelant l'API externe
   * @returns Observable<boolean>
   */
  public verifyTokenWithApi(): Observable<boolean> {
    const token = this.getToken();
    
    if (!token) {
      return new Observable<boolean>(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return this.http.post<VerifyTokenResponse>(this.VERIFY_TOKEN_URL, { token },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
      .pipe(
        tap(response => console.log('API verification response:', response)),
        map(response => {
          const isValid = response.success === true;
          return isValid;
        }),
        // Gérer les erreurs HTTP
        tap({
          error: (error) => {
            console.error('Error during token verification:', error);
          }
        })
      );
  }

  /**
   * Récupère le token depuis le sessionStorage
   * @returns string | null
   */
  public getToken(): string | null {
    const token = sessionStorage.getItem('startupkit_SESSION');
    return token;
  }

  /**
   * Sauvegarde le token dans le sessionStorage
   * @param token string
   */
  public setToken(token: string): void {
    console.log('Setting token in sessionStorage');
    sessionStorage.setItem('startupkit_SESSION', token);
    // Émettre le nouveau token décodé
    const decodedToken = this.decodeToken();
    this.tokenSubject.next(decodedToken);
  }

  /**
   * Supprime le token du sessionStorage
   * @param redirectToLogin - Si true, redirige automatiquement vers la page de login
   */
  public removeToken(redirectToLogin: boolean = false): void {
    
    // Supprimer le token local immédiatement
    this.clearLocalToken();
    
    // Appeler l'API de logout en arrière-plan (optionnel)
    this.removeTokenUser().subscribe({
      next: (success) => {
        console.log('Logout API call result:', success);
      },
      error: (error) => {
        console.error('Logout API call failed:', error);
      }
    });

    // Rediriger si demandé
    if (redirectToLogin) {
      this.redirectLoginPage();
    }
  }

  private clearLocalToken(): void {
    console.log('Clearing local token');
    sessionStorage.removeItem('startupkit_SESSION');
    // Émettre null pour indiquer qu'il n'y a plus de token
    this.tokenSubject.next(null);
  }

  private removeTokenUser(): Observable<boolean> {
    const token = this.getToken();
    
    if (!token) {
      console.log('No token found for logout');
      return new Observable<boolean>(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return this.http.post<any>(this.LOGOUT_URL, { token }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).pipe(
      map((res: any) => {
        console.log('Logout API response:', res);
        return res && res.success === true;
      }),
      tap({
        error: (error) => {
          console.error('Logout API error:', error);
        }
      })
    );
  }

  /**
   * Vérifie le token avec l'API et redirige si nécessaire
   * @returns Observable<boolean>
   */
  public checkTokenAndRedirect(): Observable<boolean> {
    // Vérifier l'URL seulement si on n'a pas encore vérifié et qu'on n'a pas de token en session
    const existingToken = this.getToken();
    
    if (!existingToken && !this.hasCheckedUrl) {
      const tokenFromUrl = this.getTokenFromUrl();
      if (tokenFromUrl) {
        this.setToken(tokenFromUrl);
        // Nettoyer l'URL après avoir récupéré le token
        this.clearTokenFromUrl();
      }
      this.hasCheckedUrl = true;
    }

    return this.verifyTokenWithApi().pipe(
      tap(isValid => console.log('Token verification result in checkTokenAndRedirect:', isValid)),
      map(isValid => {
        if (!isValid) {
          console.log('Token invalid, removing token');
          this.removeToken();
          // Réinitialiser le flag si le token est invalide
          this.hasCheckedUrl = false;
          // Ne pas rediriger ici, laisser le guard s'en charger
          return false;
        }
        return true;
      }),
      catchError((error) => {
        console.error('Error in checkTokenAndRedirect:', error);
        this.removeToken();
        // Réinitialiser le flag en cas d'erreur
        this.hasCheckedUrl = false;
        return of(false);
      })
    );
  }

  public redirectLoginPage() {
    console.log('Redirecting to login page:', this.EXTERNAL_AUTH_URL);
    window.location.href = this.EXTERNAL_AUTH_URL;
  }

  /**
   * Récupère le token depuis les paramètres de l'URL
   * @returns string | null
   */
  public getTokenFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    console.log('getTokenFromUrl called, token found:', !!token);
    return token;
  }

  /**
   * Nettoie le token de l'URL après l'avoir récupéré
   */
  private clearTokenFromUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, url.toString());
    console.log('Token cleared from URL');
  }

  /**
   * Décode le token JWT
   * @returns DecodedToken | null
   */
  public decodeToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Met à jour l'observable avec le token actuel
   * Utile pour forcer une mise à jour
   */
  public updateTokenObservable(): void {
    const decodedToken = this.decodeToken();
    this.tokenSubject.next(decodedToken);
  }
}
