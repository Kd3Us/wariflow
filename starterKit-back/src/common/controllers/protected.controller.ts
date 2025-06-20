import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { TokenAuthGuard } from '../guards/token-auth.guard';

@Controller('protected')
@UseGuards(TokenAuthGuard) // Protège toutes les routes de ce contrôleur
export class ProtectedController {
  @Get('data')
  getProtectedData(@Req() req: Request) {
    const validatedToken = req['validatedToken'];
    
    return {
      message: 'This is protected data',
      token: validatedToken,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('profile')
  getProfile(@Req() req: Request) {
    const validatedToken = req['validatedToken'];
    
    return {
      message: 'User profile data',
      token: validatedToken,
      user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      },
    };
  }
} 