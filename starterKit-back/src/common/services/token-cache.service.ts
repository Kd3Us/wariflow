import { Injectable } from '@nestjs/common';

interface CachedToken {
  token: string;
  isValid: boolean;
  validatedAt: Date;
  expiresAt: Date;
  userInfo?: any;
}

@Injectable()
export class TokenCacheService {
  private tokenCache = new Map<string, CachedToken>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  addValidToken(token: string, userInfo?: any): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION);
    
    this.tokenCache.set(token, {
      token,
      isValid: true,
      validatedAt: now,
      expiresAt,
      userInfo,
    });
  }

  isTokenValid(token: string): boolean {
    const cached = this.tokenCache.get(token);
    
    if (!cached) {
      return false;
    }

    // Vérifier si le token n'a pas expiré
    if (new Date() > cached.expiresAt) {
      this.tokenCache.delete(token);
      return false;
    }

    return cached.isValid;
  }

  getCachedUserInfo(token: string): any {
    const cached = this.tokenCache.get(token);
    
    if (!cached || new Date() > cached.expiresAt) {
      return null;
    }

    return cached.userInfo;
  }

  invalidateToken(token: string): void {
    this.tokenCache.delete(token);
  }

  clearExpiredTokens(): void {
    const now = new Date();
    for (const [token, cached] of this.tokenCache.entries()) {
      if (now > cached.expiresAt) {
        this.tokenCache.delete(token);
      }
    }
  }

  getCacheSize(): number {
    return this.tokenCache.size;
  }
}
