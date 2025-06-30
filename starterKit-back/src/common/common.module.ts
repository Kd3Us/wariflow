import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TokenVerificationService } from './services/token-verification.service';
import { TokenCacheService } from './services/token-cache.service';
import { TokenVerificationMiddleware } from './middleware/token-verification.middleware';
import { GlobalAuthMiddleware } from './middleware/global-auth.middleware';
import { TokenAuthGuard } from './guards/token-auth.guard';
import { AuthController } from './controllers/auth.controller';

@Module({
  providers: [
    TokenVerificationService,
    TokenCacheService,
    TokenAuthGuard,
  ],
  controllers: [AuthController],
  exports: [TokenVerificationService, TokenCacheService, TokenAuthGuard],
})
export class CommonModule {
  configure(consumer: MiddlewareConsumer) {
    // Option 1: Middleware spécifique pour /auth/login (approche actuelle)
    consumer
      .apply(TokenVerificationMiddleware)
      .forRoutes({ path: 'auth/login', method: RequestMethod.POST });

    // Option 2: Middleware global pour toutes les routes (décommentez pour activer)
    // consumer
    //   .apply(GlobalAuthMiddleware)
    //   .forRoutes('*');
  }
} 