import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenVerificationService } from '../services/token-verification.service';
import { TokenCacheService } from '../services/token-cache.service';

@Injectable()
export class GlobalAuthMiddleware implements NestMiddleware {
  private readonly PUBLIC_ROUTES = [
    '/auth/login',
    '/health',
    '/docs',
    '/api-docs',
  ];

  constructor(
    private readonly tokenVerificationService: TokenVerificationService,
    private readonly tokenCacheService: TokenCacheService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Nettoyer les tokens expirés périodiquement
    this.tokenCacheService.clearExpiredTokens();

    // Vérifier si la route est publique
    if (this.isPublicRoute(req.path)) {
      return next();
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new HttpException(
        'Token is required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      // Vérifier d'abord le cache
      if (this.tokenCacheService.isTokenValid(token)) {
        req['validatedToken'] = token;
        return next();
      }

      // Si pas en cache, vérifier avec l'API SpeedPresta
      const isValid = await this.tokenVerificationService.verifyToken(token);
      
      if (isValid) {
        // Ajouter au cache
        this.tokenCacheService.addValidToken(token);
        req['validatedToken'] = token;
        return next();
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

  private isPublicRoute(path: string): boolean {
    return this.PUBLIC_ROUTES.some(route => path.startsWith(route));
  }
} 