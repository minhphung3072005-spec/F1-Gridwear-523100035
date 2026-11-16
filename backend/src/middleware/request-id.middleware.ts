import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const incomingRequestId = request.header("X-Request-ID")?.trim();
  const requestId = incomingRequestId && incomingRequestId.length <= 100
    ? incomingRequestId
    : randomUUID();

  request.requestId = requestId;
  response.setHeader("X-Request-ID", requestId);
  next();
}
