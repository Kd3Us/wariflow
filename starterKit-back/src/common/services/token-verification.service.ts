import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { TokenVerificationResponse } from '../interfaces/token.interface';
import { appConfig } from '../config/app.config';

@Injectable()
export class TokenVerificationService {
  private readonly API_URL = appConfig.speedPresta.apiUrl;
  private readonly TIMEOUT = appConfig.speedPresta.timeout;

  async verifyToken(token: string): Promise<boolean> {
    try {
    console.error(token)
      const response = await axios.post<TokenVerificationResponse>(
        this.API_URL,
        {
          token,
          appid: "StartupKitZEiuiiKW0b21UKxSCxVSmrEtsfUCeVWiMxK2NdTAWd8HE6D4hOlmzI72EnPNpq4mS4AjD9aFzDU6A3oTMaDO5BnGn4il8EbEbIeKElPaIYHWmVm7PcE7sO"
        },
        {
          timeout: this.TIMEOUT,
        }
      );
      console.error(response);
      // Vérifier si la réponse indique un succès
      if (response.data.msg === 'Verified') {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new HttpException(
            'Invalid token',
            HttpStatus.UNAUTHORIZED,
          );
        }
        if (error.response?.status === 500) {
          throw new HttpException(
            'Token verification service unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }
      
      throw new HttpException(
        'Token verification failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
} 