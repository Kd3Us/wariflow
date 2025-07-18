import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class BaseHttpService {
  constructor(private jwtService: JwtService) {}

  protected getAuthHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  protected getAuthHeadersObject(): { [key: string]: string } {
    const token = this.jwtService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
}
