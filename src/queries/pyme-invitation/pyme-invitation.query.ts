import { database, transaction } from '@db/connection.db';
import { pymeInvitation } from '@db/tables/pyme-invitation.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';

@Injectable()
export class PymeInvitationQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'pyme-invitation.listPendingInvitations', type: 'method' })
  async listPendingInvitations(pymeId: number) {
    return database
      .select({
        id: pymeInvitation.id,
        email: pymeInvitation.email,
        role: pymeInvitation.role,
        status: pymeInvitation.status,
        expiresAt: pymeInvitation.expiresAt,
        createdAt: pymeInvitation.createdAt,
      })
      .from(pymeInvitation)
      .where(
        and(eq(pymeInvitation.pymeId, pymeId), eq(pymeInvitation.status, 'pending'), isNull(pymeInvitation.deletedAt)),
      )
      .orderBy(asc(pymeInvitation.createdAt));
  }

  @TraceNode({ name: 'pyme-invitation.findPendingInvitationByEmail', type: 'method' })
  async findPendingInvitationByEmail(pymeId: number, email: string) {
    const rows = await database
      .select()
      .from(pymeInvitation)
      .where(
        and(
          eq(pymeInvitation.pymeId, pymeId),
          eq(pymeInvitation.email, email),
          eq(pymeInvitation.status, 'pending'),
          isNull(pymeInvitation.deletedAt),
        ),
      );
    return rows[0];
  }

  @TraceNode({ name: 'pyme-invitation.createInvitation', type: 'method' })
  async createInvitation(data: typeof pymeInvitation.$inferInsert) {
    const rows = await database.insert(pymeInvitation).values(data).returning();
    return rows[0];
  }

  @TraceNode({ name: 'pyme-invitation.revokeInvitation', type: 'method' })
  async revokeInvitation(id: number, pymeId: number) {
    const rows = await database
      .update(pymeInvitation)
      .set({ status: 'revoked', deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(pymeInvitation.id, id),
          eq(pymeInvitation.pymeId, pymeId),
          eq(pymeInvitation.status, 'pending'),
          isNull(pymeInvitation.deletedAt),
        ),
      )
      .returning();
    return rows[0];
  }

  @TraceNode({ name: 'pyme-invitation.acceptInvitation', type: 'method' })
  async acceptInvitation(id: number) {
    return database
      .update(pymeInvitation)
      .set({ status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(pymeInvitation.id, id), eq(pymeInvitation.status, 'pending')));
  }
}
