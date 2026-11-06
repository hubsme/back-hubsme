import { UserQuery } from '@queries/user/user.query';
import { PymeQuery } from '@queries/pyme/pyme.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { SubscriptionQuery } from '@queries/subscription/subscription.query';
import { PymeMemberJoinQuery } from '@queries/pyme-member/pyme-member-join.query';
import { PymeMemberQuery } from '@queries/pyme-member/pyme-member.query';
import { PymeInvitationQuery } from '@queries/pyme-invitation/pyme-invitation.query';
import { PymeInvitationJoinQuery } from '@queries/pyme-invitation/pyme-invitation-join.query';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '@modules/auth/strategies/jwt.strategy';
import { EmailModule } from '@modules/admin/modules/email/email.module';
import { IdentityVerificationModule } from '@modules/admin/modules/identity-verification/identity-verification.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
    EmailModule,
    IdentityVerificationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UserQuery,
    PymeQuery,
    PymeJoinQuery,
    ConsultantJoinQuery,
    ConsultantQuery,
    SubscriptionQuery,
    PymeMemberJoinQuery,
    PymeMemberQuery,
    PymeInvitationQuery,
    PymeInvitationJoinQuery,
  ],
  exports: [AuthService],
})
export class AuthModule {}
