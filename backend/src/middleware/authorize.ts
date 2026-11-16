import type { NextFunction, Request, Response } from "express";

import type { UserRole } from "../generated/prisma/enums.js";
import { AppError } from "../shared/errors/app-error.js";

export function authorize(...allowedRoles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.auth) {
      next(
        new AppError({
          statusCode: 401,
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        }),
      );
      return;
    }

    if (!allowedRoles.includes(request.auth.role)) {
      next(
        new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        }),
      );
      return;
    }

    next();
  };
}
