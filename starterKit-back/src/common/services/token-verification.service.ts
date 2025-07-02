import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { TokenVerificationResponse } from '../interfaces/token.interface';
import { appConfig } from '../config/app.config';
import { decode } from 'jsonwebtoken';


@Injectable()
export class TokenVerificationService {
  private readonly API_URL = appConfig.speedPresta.apiUrl;
  private readonly TIMEOUT = appConfig.speedPresta.timeout;

  async verifyToken(token: string): Promise<boolean> {
    try {
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
      const resposesBackend = this.setUserDataManualy(response.data,token);

      // Vérifier si la réponse indique un succès
      if (resposesBackend.msg === 'Verified') {
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
        const processedResponse = this.setUserDataManualy(response.data, token);
        return processedResponse;
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


setUserDataManualy(responseData: any, token: string): TokenVerificationResponse {
  console.error('Response data:', responseData);
  
  // Vérifier si userInfo est vide, undefined, null ou un objet vide
  if (!responseData.userInfo || 
      (typeof responseData.userInfo === 'object' && Object.keys(responseData.userInfo).length === 0)) {
    
    console.log('UserInfo is empty, extracting data from token');
    const jwtPayload = decode(token);
    console.log('JWT Payload:', jwtPayload);
    
    if (jwtPayload && typeof jwtPayload === 'object') {
      const match = jwtPayload.sub?.match(/@([^.]+)\./);
      const organisation = match ? match[1] : "";
      
      // Créer un nouvel objet avec les données du JWT
      const userInfoFromToken = {
        ...jwtPayload,
        organization: organisation.toUpperCase()
      };
      
      responseData.userInfo = userInfoFromToken;
      console.log('UserInfo set from token:', userInfoFromToken);
    }
  } else {
    console.log('UserInfo already exists:', responseData.userInfo);
  }
  
  return responseData;
}
}
