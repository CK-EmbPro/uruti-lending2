import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * CompanyGuard - Enforces multi-tenancy by ensuring users can only access their company's data
 * 
 * This guard:
 * 1. Verifies the user has a companyId
 * 2. Validates that requested companyId matches user's companyId
 * 3. Automatically sets companyId in request body/query if not provided
 */
@Injectable()
export class CompanyGuard implements CanActivate {
  private readonly logger = new Logger(CompanyGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Skip company guard for public routes
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verify user is authenticated (should be checked by JwtAuthGuard first)
    if (!user) {
      this.logger.warn('CompanyGuard: No user found in request');
      throw new UnauthorizedException('User not authenticated');
    }

    // Verify user has companyId
    if (!user.companyId) {
      this.logger.warn(`CompanyGuard: User ${user.id} has no companyId`);
      throw new UnauthorizedException(
        'User must be associated with a company. Please contact your administrator.',
      );
    }

    // Extract requested companyId from various sources
    const requestedCompanyId =
      request.params?.companyId ||
      request.query?.companyId ||
      request.body?.companyId;

    // If companyId is explicitly provided, verify it matches user's company
    if (requestedCompanyId && requestedCompanyId !== user.companyId) {
      this.logger.warn(
        `CompanyGuard: User ${user.id} (company: ${user.companyId}) attempted to access company ${requestedCompanyId}`,
      );
      throw new ForbiddenException(
        'Access denied: You can only access data from your own company.',
      );
    }

    // Automatically set companyId if not provided (for convenience)
    if (!requestedCompanyId) {
      if (request.body) {
        request.body.companyId = user.companyId;
      }
      if (request.query) {
        request.query.companyId = user.companyId;
      }
    }

    // Attach companyId to request for easy access in controllers/services
    request.companyId = user.companyId;

    return true;
  }
}

