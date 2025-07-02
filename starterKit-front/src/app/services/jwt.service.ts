import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface VerifyTokenResponse {
  msg: string;
  userInfo: any;
  activation: any;
}

interface DecodedToken {
  sub: string;
  name: string;
  iat: number;
  exp: number;
  apikey: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  private readonly EXTERNAL_AUTH_URL = environment.externaleAuthUrl;
  private readonly VERIFY_TOKEN_URL = environment.verifyTokenUrl;

  constructor(private http: HttpClient) {
    console.log('JwtService initialized with URLs:', {
      verifyTokenUrl: this.VERIFY_TOKEN_URL,
      externalAuthUrl: this.EXTERNAL_AUTH_URL
    });
  }

  /**
   * Vérifie si le token JWT est valide en appelant l'API externe
   * @returns Observable<boolean>
   */
  public verifyTokenWithApi(): Observable<boolean> {
    const token = this.getToken();
    console.log('verifyTokenWithApi called, token present:', !!token);
    
    if (!token) {
      console.log('No token found in localStorage');
      return new Observable<boolean>(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    console.log('Sending token verification request to:', this.VERIFY_TOKEN_URL);
    return this.http.post<VerifyTokenResponse>(this.VERIFY_TOKEN_URL, { token })
      .pipe(
        tap(response => console.log('API verification response:', response)),
        map(response => {
          const isValid = response.msg === 'Verified';
          console.log('Token verification result:', isValid, 'Message:', response.msg);
          return isValid;
        })
      );
  }

  /**
   * Récupère le token depuis le localStorage
   * @returns string | null
   */
  public getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('getToken called, token exists:', !!token);
    return token;
  }

  /**
   * Sauvegarde le token dans le localStorage
   * @param token string
   */
  public setToken(token: string): void {
    console.log('Setting token in localStorage');
    localStorage.setItem('token', token);
  }

  /**
   * Supprime le token du localStorage
   */
  public removeToken(): void {
    console.log('Removing token from localStorage');
    localStorage.removeItem('token');
  }

  /**
   * Vérifie le token avec l'API et redirige si nécessaire
   * @returns Observable<boolean>
   */
  public checkTokenAndRedirect(): Observable<boolean> {
    console.log('checkTokenAndRedirect called');
    const tokenFromUrl = this.getTokenFromUrl();
    console.log('Token from URL:', !!tokenFromUrl);

    if (tokenFromUrl) {
      console.log('Token found in URL, setting it in localStorage');
      this.setToken(tokenFromUrl);
    }

    return this.verifyTokenWithApi().pipe(
      tap(isValid => console.log('Token verification result in checkTokenAndRedirect:', isValid)),
      map(isValid => {
        if (!isValid) {
          console.log('Token invalid, removing token and redirecting to login');
          this.removeToken();
          this.redirectLoginPage();
          return false;
        }
        console.log('Token valid, allowing access');
        return true;
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
   * Décode le token JWT
   * @returns DecodedToken | null
   */
  public decodeToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) {
      console.log('No token to decode');
      return null;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log('Token decoded successfully:', decoded);
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
} 