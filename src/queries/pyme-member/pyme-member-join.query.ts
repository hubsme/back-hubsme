import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { pymeMember } from '@db/tables/pyme-member.table';
import { pyme } from '@db/tables/pyme.table';
import { user } from '@db/tables/user.table';
import { and, asc, eq, isNull } from 'drizzle-orm';

@Injectable()
export class PymeMemberJoinQuery {
  @TraceNode({ name: 'pyme-member.findOrganizationByUserId', type: 'method' })
  async findOrganizationByUserId(userId: number) {
    const rows = await database
      .select({
        membershipId: pymeMember.id,
        pymeId: pymeMember.pymeId,
        membershipRole: pymeMember.role,
        membershipStatus: pymeMember.status,
        name: pyme.name,
        logoUrl: pyme.logoUrl,
      })
      .from(pymeMember)
      .innerJoin(pyme, and(eq(pyme.id, pymeMember.pymeId), isNull(pyme.deletedAt)))
      .where(and(eq(pymeMember.userId, userId), eq(pymeMember.status, 'active'), isNull(pymeMember.deletedAt)));
    return rows[0];
  }

  @TraceNode({ name: 'pyme-member.listMembers', type: 'method' })
  async listMembers(pymeId: number) {
    return database
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: pymeMember.role,
        status: pymeMember.status,
        joinedAt: pymeMember.joinedAt,
      })
      .from(pymeMember)
      .innerJoin(user, and(eq(user.id, pymeMember.userId), isNull(user.deletedAt)))
      .where(and(eq(pymeMember.pymeId, pymeId), isNull(pymeMember.deletedAt)))
      .orderBy(asc(pymeMember.role), asc(user.name));
  }
}
