import { randomBytes } from "node:crypto";

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { UserRole } from "../../generated/prisma/enums.js";
import { AppError } from "../../shared/errors/app-error.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { hashToken } from "../../utils/token-hash.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import type { AuthResult, PublicUser, SessionMetadata } from "./auth.types.js";

const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

// Valid bcrypt cost-12 hash used only to keep unknown-email login timing close to wrong-password timing.
const INVALID_LOGIN_PASSWORD_HASH =
  "$2b$12$fMk7uODo1f50DrUBelfuUuFmxddg3Wufb1arQKUgFybvomRvasS5O";

type SessionUser = {
  id: string;
  role: UserRole;
  tokenVersion: number;
};

function randomId(): string {
  return randomBytes(16).toString("hex");
}

function sessionExpiresAt(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);
}

function accessTokenFor(user: SessionUser): string {
  return signAccessToken({
    userId: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });
}

async function createRefreshSession(
  tx: Prisma.TransactionClient,
  user: SessionUser,
  metadata: SessionMetadata,
  familyId = randomId(),
): Promise<{ accessToken: string; refreshToken: string }> {
  const sessionId = randomId();
  const refreshToken = signRefreshToken({
    userId: user.id,
    sessionId,
    familyId,
    tokenVersion: user.tokenVersion,
  });

  await tx.refreshSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      familyId,
      tokenHash: hashToken(refreshToken),
      expiresAt: sessionExpiresAt(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
  });

  return {
    accessToken: accessTokenFor(user),
    refreshToken,
  };
}

function invalidCredentials(): AppError {
  return new AppError({
    statusCode: 401,
    code: "INVALID_CREDENTIALS",
    message: "Email or password is incorrect",
  });
}

function invalidRefreshToken(): AppError {
  return new AppError({
    statusCode: 401,
    code: "REFRESH_TOKEN_INVALID",
    message: "Refresh token is invalid or expired",
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function register(
  input: RegisterInput,
  metadata: SessionMetadata,
): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError({
      statusCode: 409,
      code: "EMAIL_ALREADY_EXISTS",
      message: "Email is already registered",
    });
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          phone: input.phone ?? null,
          role: UserRole.CUSTOMER,
          cart: { create: {} },
        },
        select: {
          ...publicUserSelect,
          tokenVersion: true,
        },
      });
      const tokens = await createRefreshSession(tx, user, metadata);
      const { tokenVersion: _tokenVersion, ...publicUser } = user;

      return {
        user: publicUser,
        ...tokens,
        accessTokenExpiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError({
        statusCode: 409,
        code: "EMAIL_ALREADY_EXISTS",
        message: "Email is already registered",
        cause: error,
      });
    }

    throw error;
  }
}

export async function login(
  input: LoginInput,
  metadata: SessionMetadata,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });
  const passwordMatches = await verifyPassword(
    input.password,
    user?.passwordHash ?? INVALID_LOGIN_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    throw invalidCredentials();
  }

  if (!user.isActive || user.deletedAt) {
    throw new AppError({
      statusCode: 403,
      code: "ACCOUNT_DISABLED",
      message: "Account is disabled",
    });
  }

  const tokens = await prisma.$transaction((tx) => createRefreshSession(tx, user, metadata));
  const publicUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: publicUserSelect,
  });

  return {
    user: publicUser,
    ...tokens,
    accessTokenExpiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  };
}

export async function refreshSession(
  refreshToken: string,
  metadata: SessionMetadata,
): Promise<Omit<AuthResult, "user">> {
  let claims;

  try {
    claims = verifyRefreshToken(refreshToken);
  } catch {
    throw invalidRefreshToken();
  }

  const tokenHash = hashToken(refreshToken);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.id !== claims.jti || session.familyId !== claims.familyId) {
    throw invalidRefreshToken();
  }

  if (session.revokedAt) {
    if (session.replacedById) {
      await prisma.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    throw invalidRefreshToken();
  }

  if (
    session.expiresAt <= new Date() ||
    !session.user.isActive ||
    session.user.deletedAt ||
    session.user.tokenVersion !== claims.tokenVersion
  ) {
    await prisma.refreshSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw invalidRefreshToken();
  }

  const newSessionId = randomId();
  const newRefreshToken = signRefreshToken({
    userId: session.user.id,
    sessionId: newSessionId,
    familyId: session.familyId,
    tokenVersion: session.user.tokenVersion,
  });
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.refreshSession.create({
      data: {
        id: newSessionId,
        userId: session.user.id,
        familyId: session.familyId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: sessionExpiresAt(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });

    const revoked = await tx.refreshSession.updateMany({
      where: {
        id: session.id,
        tokenHash,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });

    if (revoked.count !== 1) {
      throw invalidRefreshToken();
    }

    await tx.refreshSession.update({
      where: { id: session.id },
      data: { replacedById: newSessionId },
    });
  });

  return {
    accessToken: accessTokenFor(session.user),
    refreshToken: newRefreshToken,
    accessTokenExpiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  };
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshSession.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true, deletedAt: null },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError({
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
      message: "User was not found",
    });
  }

  return user;
}
