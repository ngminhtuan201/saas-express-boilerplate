export interface AuthToken {
  token: string;
  expiresAt: Date;
}

export interface OAuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl?: string;
}
