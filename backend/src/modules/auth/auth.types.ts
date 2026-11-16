import type { UserRole } from "../../generated/prisma/enums.js";

export type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

export type AuthResult = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
};
