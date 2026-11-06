import { database, transaction } from '@db/connection.db';
import { pymeMember } from '@db/tables/pyme-member.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class PymeMemberQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'pyme-member.findActiveMembershipByUserId', type: 'method' })
  async findActiveMembershipByUserId(userId: number) {
    const rows = await database
      .select()
      .from(pymeMember)
      .where(and(eq(pymeMember.userId, userId), eq(pymeMember.status, 'active'), isNull(pymeMember.deletedAt)));
    return rows[0];
  }

  @TraceNode({ name: 'pyme-member.createOwnerMembership', type: 'method' })
  async createOwnerMembership(pymeId: number, userId: number) {
    const rows = await database
      .insert(pymeMember)
      .values({ pymeId, userId, role: 'owner', status: 'active' })
      .returning();
    return rows[0];
  }

  @TraceNode({ name: 'pyme-member.removeMember', type: 'method' })
  async removeMember(pymeId: number, userId: number) {
    const rows = await database
      .update(pymeMember)
      .set({ status: 'suspended', deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(pymeMember.pymeId, pymeId),
          eq(pymeMember.userId, userId),
          eq(pymeMember.role, 'member'),
          isNull(pymeMember.deletedAt),
        ),
      )
      .returning();
    return rows[0];
  }

  @TraceNode({ name: 'pyme-member.create', type: 'method' })
  async create(data: typeof pymeMember.$inferInsert) {
    const rows = await database.insert(pymeMember).values(data).returning();
    return rows[0];
  }
}
