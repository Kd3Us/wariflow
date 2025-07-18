import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { TokenVerificationService } from '../services/token-verification.service';
import { TokenCacheService } from '../services/token-cache.service';
import { decode } from 'jsonwebtoken';

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
        // Récupérer les infos utilisateur du cache
        const cachedUserInfo = this.tokenCacheService.getCachedUserInfo(token);
        if (cachedUserInfo) {
          request['userInfo'] = cachedUserInfo;
        }
        return true;
      }

      // Si pas en cache, vérifier avec l'API SpeedPresta et récupérer les infos utilisateur
      const tokenResponse = await this.tokenVerificationService.verifyTokenAndGetUserInfo(token);
      if (tokenResponse.msg === 'Verified') {
        request['validatedToken'] = token;
        request['userInfo'] = tokenResponse.userInfo;
        if (Object.keys(request['userInfo']).length === 0) {
          const jwtPayload = decode(request['validatedToken']);
          const match = jwtPayload?.sub.match(/@([^.]+)\./);
          const organisation = match ? match[1] : "";
          jwtPayload['organization']= jwtPayload?.organization ?? organisation.toUpperCase()
          request['userInfo'] = jwtPayload;
          tokenResponse.userInfo = request['userInfo'];
        }
        // Ajouter au cache avec les infos utilisateur
        this.tokenCacheService.addValidToken(token, tokenResponse.userInfo);
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
