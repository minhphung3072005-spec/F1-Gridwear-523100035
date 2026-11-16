import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../config/prisma.js";
import { AppError } from "../shared/errors/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = request.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next(
      new AppError({
        statusCode: 401,
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required",
      }),
    );
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    const claims = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        role: true,
        isActive: true,
        deletedAt: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      next(
        new AppError({
          statusCode: 403,
          code: "ACCOUNT_DISABLED",
          message: "Account is disabled",
        }),
      );
      return;
    }

    if (user.tokenVersion !== claims.tokenVersion) {
      next(
        new AppError({
          statusCode: 401,
          code: "INVALID_ACCESS_TOKEN",
          message: "Access token is no longer valid",
        }),
      );
      return;
    }

    request.auth = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(
        new AppError({
          statusCode: 401,
          code: "ACCESS_TOKEN_EXPIRED",
          message: "Access token has expired",
          cause: error,
        }),
      );
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(
        new AppError({
          statusCode: 401,
          code: "INVALID_ACCESS_TOKEN",
          message: "Access token is invalid",
          cause: error,
        }),
      );
      return;
    }

    next(error);
  }
}
