import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenVerificationService } from '../services/token-verification.service';

@Injectable()
export class TokenVerificationMiddleware implements NestMiddleware {
  constructor(private readonly tokenVerificationService: TokenVerificationService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Vérifier si la route est auth/login
    if (req.path === '/auth/login') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new HttpException(
          'Token is required',
          HttpStatus.UNAUTHORIZED,
        );
      }

      try {
        const isValid = await this.tokenVerificationService.verifyToken(token);
        
        if (!isValid) {
          throw new HttpException(
            'Invalid token',
            HttpStatus.UNAUTHORIZED,
          );
        }

        // Ajouter le token validé à la requête pour utilisation ultérieure
        req['validatedToken'] = token;
        
        next();
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException(
          'Token verification failed',
          HttpStatus.UNAUTHORIZED,
        );
      }
    } else {
      next();
    }
  }
} 