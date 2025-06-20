import { Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    try {
      // Le middleware a déjà vérifié le token
      const validatedToken = req['validatedToken'];
      
      // Ici vous pouvez ajouter votre logique de connexion
      // Par exemple, créer une session, générer un JWT local, etc.
      
      return res.status(HttpStatus.OK).json({
        success: true,
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
} 