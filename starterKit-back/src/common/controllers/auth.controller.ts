import { Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenVerificationService } from '../services/token-verification.service';

@Controller('auth')
export class AuthController {

  constructor(private readonly tokenVerification: TokenVerificationService) {}

  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    try {
      // Le middleware a déjà vérifié le token
      const validatedToken = req['validatedToken'];
      
      // Ici vous pouvez ajouter votre logique de connexion
      // Par exemple, créer une session, générer un JWT local, etc.
      
      return res.status(HttpStatus.OK).json({
        success: true,
        role: '',
        message: 'Login successful',
        token: validatedToken,
        // Ajoutez d'autres données de réponse selon vos besoins
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Login failed',
        error: error.message,
      });
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.body.token || req['validatedToken'];
      
      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Token is required',
        });
      }

      await this.tokenVerification.revokeToken(token);
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Token revoked successfully',
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Logout failed',
        error: error.message,
      });
    }
  }
}
