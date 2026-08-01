import { User } from '@db/tables/user.table';

export type FeedbackAuthenticatedRequest = {
  user: User;
};

export type FeedbackAdminAuthenticatedRequest = {
  admin: {
    username: string;
    role: 'admin';
  };
};
