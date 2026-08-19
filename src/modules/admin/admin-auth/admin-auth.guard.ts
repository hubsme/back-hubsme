import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AdminAuthenticatedRequest } from './admin-auth-request.type';

type AdminTokenPayload = {
  username?: string;
  role?: string;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminAuthenticatedRequest>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Token administrativo requerido');
    }

    try {
      const payload = this.jwtService.verify<AdminTokenPayload>(token);
      if (payload.role !== 'admin' || !payload.username) {
        throw new UnauthorizedException('Token administrativo invalido');
      }
      request.admin = { username: payload.username, role: 'admin' };
      return true;
    } catch {
      throw new UnauthorizedException('Token administrativo invalido o expirado');
    }
  }
}
