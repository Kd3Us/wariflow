import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

export interface DecodedToken {
  exp: number;
  iat: number;
  sub: string;
  name: string;
  apikey: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  private readonly EXTERNAL_AUTH_URL = environment.externaleAuthUrl;
  private readonly VERIFY_TOKEN_URL = environment.verifyTokenUrl;
  private readonly SPEEDPRESTA_TOKEN = environment.speedPrestaToken;

  private tokenSubject = new BehaviorSubject<DecodedToken | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('JwtService initialized with SpeedPresta token');
    this.updateTokenObservable();
  }

  public verifyTokenWithApi(): Observable<boolean> {
    console.log('verifyTokenWithApi called');
    const token = this.getToken();
    
    if (!token) {
      console.log('No token available for verification');
      return of(false);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    console.log('Sending token verification request to:', this.VERIFY_TOKEN_URL);
    
    return this.http.post<any>(this.VERIFY_TOKEN_URL, {}, { headers }).pipe(
      tap(response => console.log('Token verification response:', response)),
      map(response => {
        const isValid = response && response.success === true;
        console.log('Token verification result:', isValid);
        return isValid;
      }),
      catchError(error => {
        console.error('Token verification failed:', error);
        return of(false);
      })
    );
  }

  public getToken(): string | null {
    const tokenFromUrl = this.getTokenFromUrl();
    if (tokenFromUrl) {
      console.log('Using token from URL');
      return tokenFromUrl;
    }

    const sessionToken = sessionStorage.getItem('startupkit_SESSION');
    if (sessionToken) {
      console.log('Using token from sessionStorage');
      return sessionToken;
    }

    if (this.SPEEDPRESTA_TOKEN) {
      console.log('Using SpeedPresta token from environment');
      return this.SPEEDPRESTA_TOKEN;
    }

    console.log('No token available');
    return null;
  }

  public setToken(token: string): void {
    console.log('Setting token in sessionStorage');
    sessionStorage.setItem('startupkit_SESSION', token);
    const decodedToken = this.decodeToken();
    this.tokenSubject.next(decodedToken);
  }

  public removeToken(): void {
    console.log('Removing token from sessionStorage');
    sessionStorage.removeItem('startupkit_SESSION');
    this.tokenSubject.next(null);
  }

  public checkTokenAndRedirect(): Observable<boolean> {
    console.log('checkTokenAndRedirect called');
    const tokenFromUrl = this.getTokenFromUrl();
    
    if (tokenFromUrl) {
      console.log('Token found in URL, setting it in sessionStorage');
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

  public getTokenFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    return token;
  }

  public decodeToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) {
      console.log('No token to decode');
      return null;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log('Token decoded successfully:', {
        sub: decoded.sub,
        name: decoded.name,
        exp: new Date(decoded.exp * 1000),
        apikey: decoded.apikey
      });
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  public updateTokenObservable(): void {
    const decodedToken = this.decodeToken();
    this.tokenSubject.next(decodedToken);
  }

  public isTokenExpired(): boolean {
    const decoded = this.decodeToken();
    if (!decoded) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp < now;
    
    if (isExpired) {
      console.log('Token is expired');
    }
    
    return isExpired;
  }
}