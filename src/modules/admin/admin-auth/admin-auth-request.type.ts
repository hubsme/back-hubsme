export type AdminAuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  admin: {
    username: string;
    role: 'admin';
  };
};
