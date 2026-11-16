import type { CookieOptions, Request, Response } from "express";

import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import {
  getCurrentUser,
  login,
  logout,
  refreshSession,
  register,
} from "./auth.service.js";
import type { SessionMetadata } from "./auth.types.js";

function sessionMetadata(request: Request): SessionMetadata {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.get("user-agent")?.slice(0, 512) ?? null,
  };
}

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: `${env.API_PREFIX}/auth`,
    maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
  };
}

function clearRefreshCookie(response: Response): void {
  const { maxAge: _maxAge, ...clearOptions } = refreshCookieOptions();
  response.clearCookie(env.REFRESH_COOKIE_NAME, clearOptions);
}

function readRefreshToken(request: Request): string | undefined {
  const token = (request.cookies as Record<string, unknown> | undefined)?.[
    env.REFRESH_COOKIE_NAME
  ];
  return typeof token === "string" && token.length > 0 ? token : undefined;
}

export async function registerController(request: Request, response: Response): Promise<Response> {
  const result = await register(request.body as RegisterInput, sessionMetadata(request));
  response.cookie(env.REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

  return sendSuccess(response, {
    statusCode: 201,
    message: "Registration successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.accessTokenExpiresIn,
    },
  });
}

export async function loginController(request: Request, response: Response): Promise<Response> {
  const result = await login(request.body as LoginInput, sessionMetadata(request));
  response.cookie(env.REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

  return sendSuccess(response, {
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.accessTokenExpiresIn,
    },
  });
}

export async function refreshController(request: Request, response: Response): Promise<Response> {
  const currentRefreshToken = readRefreshToken(request);

  if (!currentRefreshToken) {
    throw new AppError({
      statusCode: 401,
      code: "REFRESH_TOKEN_INVALID",
      message: "Refresh token is missing",
    });
  }

  const result = await refreshSession(currentRefreshToken, sessionMetadata(request));
  response.cookie(env.REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

  return sendSuccess(response, {
    message: "Token refreshed successfully",
    data: {
      accessToken: result.accessToken,
      expiresIn: result.accessTokenExpiresIn,
    },
  });
}

export async function logoutController(request: Request, response: Response): Promise<Response> {
  await logout(readRefreshToken(request));
  clearRefreshCookie(response);
  return sendNoContent(response);
}

export async function meController(request: Request, response: Response): Promise<Response> {
  if (!request.auth) {
    throw new AppError({
      statusCode: 401,
      code: "AUTHENTICATION_REQUIRED",
      message: "Authentication is required",
    });
  }

  const user = await getCurrentUser(request.auth.userId);
  return sendSuccess(response, {
    message: "Current user fetched successfully",
    data: { user },
  });
}
