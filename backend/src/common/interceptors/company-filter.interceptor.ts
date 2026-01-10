import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * CompanyFilterInterceptor - Automatically adds companyId filter to queries
 * 
 * This interceptor ensures that all database queries are automatically filtered
 * by the user's companyId, providing an additional layer of security.
 */
@Injectable()
export class CompanyFilterInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CompanyFilterInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only apply filter if user has companyId
    if (user?.companyId) {
      // Ensure companyId is set in query parameters
      if (request.query && !request.query.companyId) {
        request.query.companyId = user.companyId;
      }

      // Ensure companyId is set in body (if body exists and doesn't have companyId)
      if (request.body && typeof request.body === 'object' && !request.body.companyId) {
        request.body.companyId = user.companyId;
      }

      // Store companyId in request for easy access
      request.companyId = user.companyId;
    }

    return next.handle();
  }
}

