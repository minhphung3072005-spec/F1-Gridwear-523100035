import { rateLimit } from "express-rate-limit";

import { env } from "../config/env.js";

function createRateLimiter(limit: number, windowMs: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler(request, response, _next, options) {
      response.status(options.statusCode).json({
        success: false,
        message: "Too many requests, please try again later",
        code: "RATE_LIMIT_EXCEEDED",
        errors: [],
        requestId: request.requestId,
      });
    },
  });
}

export const apiRateLimiter = createRateLimiter(
  env.RATE_LIMIT_MAX,
  env.RATE_LIMIT_WINDOW_MS,
);

export const authRateLimiter = createRateLimiter(10, 15 * 60 * 1000);
export const refreshRateLimiter = createRateLimiter(30, 15 * 60 * 1000);
