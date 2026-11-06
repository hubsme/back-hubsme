import { PymeQuery } from '@queries/pyme/pyme.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { MeetingQuery } from '@queries/meeting/meeting.query';
import { MeetingJoinQuery } from '@queries/meeting/meeting-join.query';
import { DiagnosticJoinQuery } from '@queries/diagnostic/diagnostic-join.query';
import { DiagnosticQuery } from '@queries/diagnostic/diagnostic.query';
import { PymeMemberJoinQuery } from '@queries/pyme-member/pyme-member-join.query';
import { PymeMemberQuery } from '@queries/pyme-member/pyme-member.query';
import { PymeInvitationQuery } from '@queries/pyme-invitation/pyme-invitation.query';
import { PymeInvitationJoinQuery } from '@queries/pyme-invitation/pyme-invitation-join.query';
import { UserQuery } from '@queries/user/user.query';
import { Module } from '@nestjs/common';
import { PymeController } from '@modules/admin/modules/pyme/pyme.controller';
import { PymeService } from '@modules/admin/modules/pyme/pyme.service';
import { AdminAuthModule } from '@modules/admin/modules/admin-auth/admin-auth.module';
import { WhatsappModule } from '@modules/admin/modules/whatsapp/whatsapp.module';
import { EmailModule } from '@modules/admin/modules/email/email.module';
import { PymeAdminController } from '@modules/admin/modules/pyme/controllers/pyme-admin/pyme-admin.controller';

@Module({
  imports: [AdminAuthModule, WhatsappModule, EmailModule],
  controllers: [PymeAdminController, PymeController],
  providers: [
    PymeService,
    PymeQuery,
    PymeJoinQuery,
    ConsultantJoinQuery,
    ConsultantQuery,
    MeetingQuery,
    MeetingJoinQuery,
    DiagnosticJoinQuery,
    DiagnosticQuery,
    PymeMemberJoinQuery,
    PymeMemberQuery,
    PymeInvitationQuery,
    PymeInvitationJoinQuery,
    UserQuery,
  ],
  exports: [PymeService],
})
export class PymeModule {}
