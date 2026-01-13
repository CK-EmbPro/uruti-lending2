import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    const cookieToken = request.cookies?.access_token;

    console.log('[JwtAuthGuard] Checking authentication:', {
      url: request.url,
      method: request.method,
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : null,
    });

    // Try to get token from cookie first, then Authorization header
    let token: string | null = null;
    
    if (cookieToken) {
      token = cookieToken;
      console.log('[JwtAuthGuard] Using token from cookie');
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('[JwtAuthGuard] Using token from Authorization header');
    }

    if (!token) {
      console.warn('[JwtAuthGuard] No token provided');
      throw new UnauthorizedException('No token provided');
    }

    try {
      console.log('[JwtAuthGuard] Verifying token:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
      });
      
      // Verify token (JwtService uses the secret from module config by default)
      const payload = this.jwtService.verify(token);
      
      console.log('[JwtAuthGuard] Token verified successfully:', {
        userId: payload.sub,
        email: payload.email,
        companyId: payload.companyId,
      });
      
      // Attach user payload to request for use in controllers and other guards
      request.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
        companyId: payload.companyId || null, // Include companyId for multi-tenancy
      };
      
      return true;
    } catch (error) {
      console.error('[JwtAuthGuard] Token verification failed:', {
        error: error.message,
        errorName: error.name,
        stack: error.stack,
      });
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
