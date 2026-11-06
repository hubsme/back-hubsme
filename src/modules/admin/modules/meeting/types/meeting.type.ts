import type { AuthenticatedUser } from '@modules/auth/types/authenticated-user.type';

export type MeetingRequester = Pick<AuthenticatedUser, 'id' | 'role' | 'pymeId' | 'membershipRole'>;
