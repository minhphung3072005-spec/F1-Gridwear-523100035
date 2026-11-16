import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { AppError, type ErrorDetail } from "../shared/errors/app-error.js";

type ErrorPayload = {
  success: false;
  message: string;
  code: string;
  errors: ErrorDetail[];
  requestId: string;
  stack?: string;
};

export const errorMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";
  let errors: ErrorDetail[] = [];

  if (error instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    errors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    errors = error.errors ?? [];
  } else if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Request body contains invalid JSON";
  }

  const payload: ErrorPayload = {
    success: false,
    message,
    code,
    errors,
    requestId: request.requestId,
  };

  if (env.NODE_ENV === "development" && error instanceof Error && error.stack) {
    payload.stack = error.stack;
  }

  if (statusCode >= 500) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "unhandled_request_error",
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }),
    );
  }

  response.status(statusCode).json(payload);
};
