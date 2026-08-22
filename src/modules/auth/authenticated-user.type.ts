import { User } from '@db/tables/user.table';
import { PymeMemberRole } from '@modules/admin/pyme/dto/pyme-membership.dto';

export type AuthenticatedOrganization = {
  id: number;
  name: string;
  logoUrl: string | null;
  membershipRole: PymeMemberRole;
};

export type AuthenticatedUser = Omit<User, 'password'> & {
  pymeId: number | null;
  membershipRole: PymeMemberRole | null;
  organization: AuthenticatedOrganization | null;
};

export type AuthenticatedRequest = { user: AuthenticatedUser };
