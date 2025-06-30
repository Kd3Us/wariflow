import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { TokenVerificationService } from '../services/token-verification.service';
import { TokenCacheService } from '../services/token-cache.service';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private readonly tokenVerificationService: TokenVerificationService,
    private readonly tokenCacheService: TokenCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new HttpException(
        'Token is required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      // Vérifier d'abord le cache
      if (this.tokenCacheService.isTokenValid(token)) {
        request['validatedToken'] = token;
        return true;
      }

      // Si pas en cache, vérifier avec l'API SpeedPresta et récupérer les infos utilisateur
      const tokenResponse = await this.tokenVerificationService.verifyTokenAndGetUserInfo(token);
      
      if (tokenResponse.msg === 'Verified') {
        // Ajouter au cache
        this.tokenCacheService.addValidToken(token);
        request['validatedToken'] = token;
        request['userInfo'] = tokenResponse.userInfo;
        return true;
      }

      throw new HttpException(
        'Invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Token verification failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
