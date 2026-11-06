import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { pymeInvitation } from '@db/tables/pyme-invitation.table';
import { pyme } from '@db/tables/pyme.table';
import { and, eq, gt, isNull } from 'drizzle-orm';

@Injectable()
export class PymeInvitationJoinQuery {
  @TraceNode({ name: 'pyme-invitation.findPendingInvitationByTokenHash', type: 'method' })
  async findPendingInvitationByTokenHash(tokenHash: string) {
    const rows = await database
      .select({
        id: pymeInvitation.id,
        pymeId: pymeInvitation.pymeId,
        email: pymeInvitation.email,
        role: pymeInvitation.role,
        status: pymeInvitation.status,
        invitedByUserId: pymeInvitation.invitedByUserId,
        expiresAt: pymeInvitation.expiresAt,
        organizationName: pyme.name,
      })
      .from(pymeInvitation)
      .innerJoin(pyme, and(eq(pyme.id, pymeInvitation.pymeId), isNull(pyme.deletedAt)))
      .where(
        and(
          eq(pymeInvitation.tokenHash, tokenHash),
          eq(pymeInvitation.status, 'pending'),
          gt(pymeInvitation.expiresAt, new Date()),
          isNull(pymeInvitation.deletedAt),
        ),
      );
    return rows[0];
  }
}
