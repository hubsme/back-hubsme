import type { user } from '@db/tables/user.table';

export type FeedbackAuthenticatedRequest = {
  user: typeof user.$inferSelect;
};

export type FeedbackAdminAuthenticatedRequest = {
  admin: {
    username: string;
    role: 'admin';
  };
};
