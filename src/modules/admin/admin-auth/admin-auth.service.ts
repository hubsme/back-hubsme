import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(private readonly jwtService: JwtService) {}

  login(data: AdminLoginDto) {
    const configuredUsername = process.env.ADMIN_USERNAME?.trim();
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredUsername || !configuredPassword) {
      throw new UnauthorizedException('Acceso administrativo no configurado');
    }

    if (
      !this.safeEquals(data.username.trim(), configuredUsername) ||
      !this.safeEquals(data.password, configuredPassword)
    ) {
      throw new UnauthorizedException('Credenciales administrativas invalidas');
    }

    return {
      accessToken: this.jwtService.sign({
        sub: `admin:${configuredUsername}`,
        username: configuredUsername,
        role: 'admin',
      }),
      user: {
        username: configuredUsername,
        role: 'admin' as const,
      },
    };
  }

  private safeEquals(value: string, expected: string) {
    const valueBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
  }
}
