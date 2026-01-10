import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.roles) {
      return false;
    }
    
    // Case-insensitive role matching
    const userRoles = Array.isArray(user.roles) 
      ? user.roles.map((r: string) => r?.toLowerCase()) 
      : [];
    return requiredRoles.some((role) => 
      userRoles.includes(role.toLowerCase())
    );
  }
}

