import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env.js";
import { UserRole } from "../generated/prisma/enums.js";

type AccessTokenInput = {
  userId: string;
  role: UserRole;
  tokenVersion: number;
};

type RefreshTokenInput = {
  userId: string;
  sessionId: string;
  familyId: string;
  tokenVersion: number;
};

export type AccessTokenClaims = JwtPayload & {
  sub: string;
  role: UserRole;
  tokenVersion: number;
  type: "access";
};

export type RefreshTokenClaims = JwtPayload & {
  sub: string;
  jti: string;
  familyId: string;
  tokenVersion: number;
  type: "refresh";
};

export function signAccessToken(input: AccessTokenInput): string {
  return jwt.sign(
    {
      role: input.role,
      tokenVersion: input.tokenVersion,
      type: "access",
    },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: "HS256",
      subject: input.userId,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    },
  );
}

export function signRefreshToken(input: RefreshTokenInput): string {
  return jwt.sign(
    {
      familyId: input.familyId,
      tokenVersion: input.tokenVersion,
      type: "refresh",
    },
    env.JWT_REFRESH_SECRET,
    {
      algorithm: "HS256",
      subject: input.userId,
      jwtid: input.sessionId,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
    },
  );
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  if (
    typeof payload === "string" ||
    payload.type !== "access" ||
    typeof payload.sub !== "string" ||
    !Object.values(UserRole).includes(payload.role as UserRole) ||
    typeof payload.tokenVersion !== "number"
  ) {
    throw new jwt.JsonWebTokenError("Invalid access token claims");
  }

  return payload as AccessTokenClaims;
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  if (
    typeof payload === "string" ||
    payload.type !== "refresh" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string" ||
    typeof payload.familyId !== "string" ||
    typeof payload.tokenVersion !== "number"
  ) {
    throw new jwt.JsonWebTokenError("Invalid refresh token claims");
  }

  return payload as RefreshTokenClaims;
}
