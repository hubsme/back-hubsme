export type AuthRole = 'pyme' | 'consultor';

export type GoogleAuthFlow = 'login' | 'register' | 'invitation';

export type GoogleState = {
  flow: GoogleAuthFlow;
  role?: AuthRole;
  invitationToken?: string;
};

export type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};
