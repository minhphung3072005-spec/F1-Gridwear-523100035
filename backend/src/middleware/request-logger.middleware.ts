import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";

const logPriorities = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
} as const;

export function requestLoggerMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const startedAt = process.hrtime.bigint();

  response.on("finish", () => {
    if (logPriorities[env.LOG_LEVEL] > logPriorities.info) {
      return;
    }

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.info(
      JSON.stringify({
        level: "info",
        event: "http_request",
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      }),
    );
  });

  next();
}
