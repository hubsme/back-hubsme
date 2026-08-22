import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { pymeInvitation, PymeInvitationDTO } from '@db/tables/pyme-invitation.table';
import { pymeMember } from '@db/tables/pyme-member.table';
import { pyme } from '@db/tables/pyme.table';
import { user, UserDTO } from '@db/tables/user.table';

@Injectable()
export class PymeMembershipRepository {
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

  async findActiveMembershipByUserId(userId: number) {
    const rows = await database
      .select()
      .from(pymeMember)
      .where(and(eq(pymeMember.userId, userId), eq(pymeMember.status, 'active'), isNull(pymeMember.deletedAt)));
    return rows[0];
  }

  async createOwnerMembership(pymeId: number, userId: number) {
    const rows = await database
      .insert(pymeMember)
      .values({ pymeId, userId, role: 'owner', status: 'active' })
      .returning();
    return rows[0];
  }

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

  async createInvitation(data: PymeInvitationDTO) {
    const rows = await database.insert(pymeInvitation).values(data).returning();
    return rows[0];
  }

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

  async acceptInvitationForExistingUser(invitationId: number, pymeId: number, userId: number) {
    return database.transaction(async (tx) => {
      const inserted = await tx
        .insert(pymeMember)
        .values({ pymeId, userId, role: 'member', status: 'active' })
        .returning();
      await tx
        .update(pymeInvitation)
        .set({ status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(pymeInvitation.id, invitationId), eq(pymeInvitation.status, 'pending')));
      return inserted[0];
    });
  }

  async createInvitedUserAndAcceptInvitation(data: { invitationId: number; pymeId: number; user: UserDTO }) {
    return database.transaction(async (tx) => {
      const createdUsers = await tx.insert(user).values(data.user).returning();
      const createdUser = createdUsers[0];
      const memberships = await tx
        .insert(pymeMember)
        .values({ pymeId: data.pymeId, userId: createdUser.id, role: 'member', status: 'active' })
        .returning();
      await tx
        .update(pymeInvitation)
        .set({ status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(pymeInvitation.id, data.invitationId), eq(pymeInvitation.status, 'pending')));
      return { user: createdUser, membership: memberships[0] };
    });
  }
}
