import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { TokenVerificationResponse } from '../interfaces/token.interface';
import { appConfig } from '../config/app.config';
import { decode } from 'jsonwebtoken';


@Injectable()
export class TokenVerificationService {
  private readonly API_URL = appConfig.speedPresta.apiUrl;
  private readonly TIMEOUT = appConfig.speedPresta.timeout;
  private readonly API_LOGOUT_URL = appConfig.speedPresta.apiLogoutUrl;
  private readonly APP_ID = appConfig.speedPresta.appId;

  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await axios.post<TokenVerificationResponse>(
        this.API_URL,
        {
          token,
          appid: this.APP_ID
        },
        {
          timeout: this.TIMEOUT,
        }
      );

      // Vérifier si la réponse indique un succès
      if (response.data.msg === 'Verified') {
        this.checkUserData(response.data);
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

  async revokeToken(token: string): Promise<any> {
    try {
      const response = await axios.post(
        this.API_LOGOUT_URL,
        {
          token,
          appid: this.APP_ID
        },
        {
          timeout: this.TIMEOUT,
        }
      );
      
      console.log('Token revocation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Token revocation error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new HttpException(
            'Invalid token for revocation',
            HttpStatus.UNAUTHORIZED,
          );
        }
        if (error.response?.status === 500) {
          throw new HttpException(
            'Token revocation service unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }
      
      throw new HttpException(
        'Token revocation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyTokenAndGetUserInfo(token: string): Promise<TokenVerificationResponse> {
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
      
      // Vérifier si la réponse indique un succès
      if (response.data.msg === 'Verified') {
        this.checkUserData(response.data);
        return response.data;
      }
      
      throw new HttpException(
        'Invalid token',
        HttpStatus.UNAUTHORIZED,
      );
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

  checkUserData(responseData) {
      if (!responseData.userInfo || 
        (typeof responseData.userInfo === 'object' && Object.keys(responseData.userInfo).length === 0)) {
          throw new HttpException(
            'Invalid token',
            HttpStatus.UNAUTHORIZED,
          );
        } else {
        if (!responseData.userInfo.organization) {
          throw new HttpException(
            'Invalid token',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }
}
