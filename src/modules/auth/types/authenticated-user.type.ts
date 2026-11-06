import type { pymeMember } from '@db/tables/pyme-member.table';
import type { user } from '@db/tables/user.table';

export type AuthenticatedOrganization = {
  id: number;
  name: string;
  logoUrl: string | null;
  membershipRole: (typeof pymeMember.$inferSelect)['role'];
};

export type AuthenticatedUser = Omit<typeof user.$inferSelect, 'password'> & {
  pymeId: number | null;
  membershipRole: (typeof pymeMember.$inferSelect)['role'] | null;
  organization: AuthenticatedOrganization | null;
};

export type AuthenticatedRequest = { user: AuthenticatedUser };
