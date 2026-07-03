import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '@repositories/user.repository';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { SubscriptionRepository } from '@repositories/subscription.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthUrlDto } from './dto/google-auth-url.dto';
import { GoogleCallbackQueryDto } from './dto/google-callback-query.dto';
import * as bcrypt from 'bcrypt';
import { handleDbError } from '@functions/db-error.function';
import { randomUUID } from 'crypto';
import { EmailService } from '@modules/admin/email/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type AuthRole = 'pyme' | 'consultor';
type GoogleAuthFlow = 'login' | 'register';

type GoogleState = {
  flow: GoogleAuthFlow;
  role?: AuthRole;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly pymeRepository: PymeRepository,
    private readonly consultantRepository: ConsultantRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.isActive !== 'true') {
      throw new UnauthorizedException('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      const role = registerDto.role ?? 'pyme';
      const firstName = registerDto.firstName?.trim();
      const lastName = registerDto.lastName?.trim();
      const displayName = this.buildDisplayName(registerDto);

      if (role === 'consultor' && (!firstName || !lastName)) {
        throw new BadRequestException(['Completa nombres y apellidos del consultor']);
      }

      if (role === 'consultor' && !registerDto.diagnosticAreas?.length) {
        throw new BadRequestException(['Selecciona al menos un área de diagnóstico']);
      }

      if (role === 'pyme' && (!registerDto.name?.trim() || !registerDto.ruc?.trim() || !firstName || !lastName)) {
        throw new BadRequestException(['Completa empresa, RUC y datos del dueño']);
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const user = await this.userRepository.create({
        email: registerDto.email.trim().toLowerCase(),
        password: hashedPassword,
        name: displayName,
        firstName,
        lastName,
        role,
        authProvider: 'local',
        isActive: 'true',
      });

      if (user.role === 'consultor') {
        await this.consultantRepository.create({
          id: user.id,
          fullName: user.name,
          firstName,
          lastName,
          ownerPhone: registerDto.ownerPhone?.trim(),
          headline: registerDto.headline?.trim(),
          location: registerDto.location?.trim(),
          workModality: registerDto.workModality?.trim(),
          linkedinUrl: registerDto.linkedinUrl?.trim(),
          bio: registerDto.bio?.trim(),
          diagnosticAreas: registerDto.diagnosticAreas,
          specialties: this.cleanTextList(registerDto.specialties),
          sectors: this.cleanTextList(registerDto.sectors),
          industries: this.cleanTextList(registerDto.industries),
          companyTypes: this.cleanTextList(registerDto.companyTypes),
          services: this.cleanTextList(registerDto.services),
          yearsExperience: registerDto.yearsExperience,
          education: registerDto.education,
          certifications: this.cleanTextList(registerDto.certifications),
          workedSectors: this.cleanTextList(registerDto.workedSectors),
          caseStudies: registerDto.caseStudies,
          cvText: registerDto.cvText?.trim(),
          cvUrl: registerDto.cvUrl?.trim(),
          active: 'true',
          validated: 'false',
        });
      } else if (user.role === 'pyme') {
        await this.pymeRepository.create({
          id: user.id,
          name: registerDto.name.trim(),
          ruc: registerDto.ruc?.trim(),
          ownerFirstName: firstName,
          ownerLastName: lastName,
          ownerEmail: user.email,
          ownerPhone: registerDto.ownerPhone?.trim(),
          ownerPosition: registerDto.ownerPosition?.trim(),
        });
      }

      // Create default free subscription
      await this.subscriptionRepository.create({
        userId: user.id,
        plan: 'free',
        status: 'active',
        startedAt: new Date(),
      });

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);
      const { password: _, ...userWithoutPassword } = user;

      return {
        accessToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      handleDbError(error);
    }
  }

  getGoogleAuthUrl(query: GoogleAuthUrlDto) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new BadRequestException(['Google OAuth no esta configurado en el backend']);
    }

    const flow = query.flow ?? 'login';
    if (flow === 'register' && !query.role) {
      throw new BadRequestException(['Selecciona el tipo de perfil para crear la cuenta con Google']);
    }

    const state = this.jwtService.sign({ flow, role: query.role } satisfies GoogleState, { expiresIn: '10m' });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      access_type: 'offline',
      state,
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  }

  async handleGoogleCallback(query: GoogleCallbackQueryDto) {
    try {
      if (query.error) {
        return this.buildGooglePopupResponse({ error: query.error });
      }

      if (!query.code || !query.state) {
        return this.buildGooglePopupResponse({ error: 'Faltan parametros de autenticacion de Google' });
      }

      const state = this.jwtService.verify<GoogleState>(query.state);
      const token = await this.exchangeGoogleCode(query.code);
      const googleUser = await this.getGoogleUserInfo(token.access_token);

      if (!googleUser.email_verified) {
        throw new UnauthorizedException('Google no verifico este correo');
      }

      const session =
        state.flow === 'register'
          ? await this.registerWithGoogle(googleUser, state.role ?? 'pyme')
          : await this.loginWithGoogle(googleUser);
      return this.buildGooglePopupResponse({ session });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo autenticar con Google';
      return this.buildGooglePopupResponse({ error: message });
    }
  }

  async validateUser(userId: number) {
    const user = await this.userRepository.findOne(userId);
    if (!user || user.isActive !== 'true') {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private async exchangeGoogleCode(code: string): Promise<Required<Pick<GoogleTokenResponse, 'access_token'>>> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException(['Google OAuth no esta configurado en el backend']);
    } 

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = (await response.json()) as GoogleTokenResponse;
    if (!response.ok || !data.access_token) {
      throw new UnauthorizedException(data.error_description ?? data.error ?? 'Google rechazo el codigo de acceso');
    }

    return { access_token: data.access_token };
  }

  private async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new UnauthorizedException('No se pudo obtener el perfil de Google');
    }

    return (await response.json()) as GoogleUserInfo;
  }

  private async loginWithGoogle(googleUser: GoogleUserInfo) {
    const email = googleUser.email.trim().toLowerCase();
    const googleUserById = await this.userRepository.findByGoogleId(googleUser.sub);
    const user = googleUserById ?? (await this.userRepository.findByEmail(email));

    if (!user) {
      throw new UnauthorizedException('Esta cuenta de Google no esta registrada en Hubsme');
    }

    if (user.isActive !== 'true') {
      throw new UnauthorizedException('User account is inactive');
    }

    const linkedUser =
      user.googleId === googleUser.sub
        ? user
        : await this.userRepository.update(user.id, {
            googleId: googleUser.sub,
            authProvider: 'google',
          });

    // Save or update photo url/logo url if missing
    if (linkedUser.role === 'consultor') {
      const profile = await this.consultantRepository.findByUserId(linkedUser.id);
      if (profile && !profile.photoUrl && googleUser.picture) {
        await this.consultantRepository.update(profile.id, {
          photoUrl: googleUser.picture,
        });
      }
    } else if (linkedUser.role === 'pyme') {
      const profile = await this.pymeRepository.findByUserId(linkedUser.id);
      if (profile && !profile.logoUrl && googleUser.picture) {
        await this.pymeRepository.update(profile.id, {
          logoUrl: googleUser.picture,
        });
      }
    }

    return this.buildSession(linkedUser);
  }

  private async registerWithGoogle(googleUser: GoogleUserInfo, role: AuthRole) {
    try {
      const email = googleUser.email.trim().toLowerCase();
      const firstName = googleUser.given_name?.trim() || googleUser.name?.split(' ')[0]?.trim() || 'Usuario';
      const lastName = googleUser.family_name?.trim() || googleUser.name?.split(' ').slice(1).join(' ').trim() || '';
      const name = [firstName, lastName].filter(Boolean).join(' ');

      const existingUserByGoogleId = await this.userRepository.findByGoogleId(googleUser.sub);
      const existingUserByEmail = await this.userRepository.findByEmail(email);

      if (existingUserByGoogleId || existingUserByEmail) {
        throw new BadRequestException(['El correo electrónico ya está registrado']);
      }

      const user = await this.userRepository.create({
        email,
        password: await bcrypt.hash(`google:${googleUser.sub}:${randomUUID()}`, 10),
        name,
        firstName,
        lastName,
        role,
        authProvider: 'google',
        googleId: googleUser.sub,
        isActive: 'true',
      });

      if (user.role === 'consultor') {
        const profile = await this.consultantRepository.findByUserId(user.id);
        if (!profile) {
          await this.consultantRepository.create({
            id: user.id,
            fullName: user.name,
            firstName: user.firstName ?? firstName,
            lastName: user.lastName ?? lastName,
            photoUrl: googleUser.picture,
            active: 'true',
            validated: 'false',
          });
        } else if (!profile.photoUrl && googleUser.picture) {
          await this.consultantRepository.update(profile.id, {
            photoUrl: googleUser.picture,
          });
        }
      }

      if (user.role === 'pyme') {
        const profile = await this.pymeRepository.findByUserId(user.id);
        if (!profile) {
          await this.pymeRepository.create({
            id: user.id,
            name: user.name,
            ownerFirstName: user.firstName ?? firstName,
            ownerLastName: user.lastName ?? lastName,
            ownerEmail: user.email,
            logoUrl: googleUser.picture,
          });
        } else if (!profile.logoUrl && googleUser.picture) {
          await this.pymeRepository.update(profile.id, {
            logoUrl: googleUser.picture,
          });
        }
      }

      // Create default free subscription
      await this.subscriptionRepository.create({
        userId: user.id,
        plan: 'free',
        status: 'active',
        startedAt: new Date(),
      });

      return this.buildSession(user);
    } catch (error) {
      handleDbError(error);
    }
  }

  private buildSession(user: NonNullable<Awaited<ReturnType<UserRepository['findOne']>>>) {
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;
    return { accessToken, user: userWithoutPassword };
  }

  private buildDisplayName(registerDto: RegisterDto) {
    if (registerDto.role === 'consultor') {
      return [registerDto.firstName?.trim(), registerDto.lastName?.trim()].filter(Boolean).join(' ');
    }

    return registerDto.name.trim();
  }

  private cleanTextList(value?: string[]) {
    return value?.map((item) => item.trim().replace(/\s+/g, ' ')).filter(Boolean);
  }

  private buildGooglePopupResponse(data: { session?: unknown; error?: string }) {
    const frontendUrl = process.env.FRONTEND_URL ?? process.env.WEB_URL ?? '*';
    const payload = JSON.stringify({ type: 'hubsme:google-auth', ...data });
    const targetOrigin = this.getTargetOrigin(frontendUrl);

    return `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8"><title>Google Auth</title></head>
  <body>
    <script>
      window.opener && window.opener.postMessage(${payload}, ${JSON.stringify(targetOrigin)});
      window.close();
    </script>
  </body>
</html>`;
  }

  private getTargetOrigin(frontendUrl: string) {
    if (frontendUrl === '*') return '*';

    try {
      return new URL(frontendUrl).origin;
    } catch {
      return '*';
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const cleanEmail = email.trim().toLowerCase();

    const user = await this.userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new BadRequestException('No existe ninguna cuenta registrada con este correo electrónico');
    }

    if (user.isActive !== 'true') {
      throw new BadRequestException('Esta cuenta está inactiva');
    }

    if (user.authProvider === 'google') {
      throw new BadRequestException('Esta cuenta se registró utilizando Google. Por favor, inicia sesión con Google');
    }

    const secret = `${process.env.JWT_SECRET}-${user.password}`;
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret, expiresIn: '15m' },
    );

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:6200';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3876c7; margin: 0; font-size: 24px;">Restablecer Contraseña</h2>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Solicitud de recuperación de cuenta en HUBSME</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 15px; color: #374151; line-height: 1.5;">Hola, <strong>${user.name}</strong>:</p>
        <p style="font-size: 15px; color: #374151; line-height: 1.5;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si no fuiste tú, puedes ignorar este correo de forma segura.</p>
        <p style="font-size: 15px; color: #374151; line-height: 1.5;">Para restablecer tu contraseña, haz clic en el botón de abajo. Este enlace expira en 15 minutos:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3876c7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(56, 118, 199, 0.2);">Restablecer contraseña</a>
        </div>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
        <p style="font-size: 12px; color: #3876c7; word-break: break-all; line-height: 1.5;"><a href="${resetUrl}" style="color: #3876c7;">${resetUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">HUBSME &copy; 2026. Todos los derechos reservados.</p>
      </div>
    `;

    await this.emailService.sendEmail({
      to: cleanEmail,
      subject: 'Restablecer contraseña - HUBSME',
      text: `Hola ${user.name}, para restablecer tu contraseña accede al siguiente enlace: ${resetUrl}`,
      html: mailHtml,
    });

    return { message: 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    let decoded: { sub: number; email: string };
    try {
      decoded = this.jwtService.decode(token) as { sub: number; email: string };
    } catch (err) {
      throw new BadRequestException('El token proporcionado no es válido');
    }

    if (!decoded || !decoded.sub) {
      throw new BadRequestException('El token es inválido o está corrupto');
    }

    const user = await this.userRepository.findOne(decoded.sub);
    if (!user) {
      throw new BadRequestException('El usuario no existe');
    }

    const secret = `${process.env.JWT_SECRET}-${user.password}`;
    try {
      this.jwtService.verify(token, { secret });
    } catch (err) {
      throw new BadRequestException('El enlace para restablecer la contraseña es inválido o ha expirado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepository.update(user.id, { password: hashedPassword });

    return { message: 'Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña' };
  }
}
