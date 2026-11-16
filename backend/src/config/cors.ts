import type { CorsOptions } from "cors";

import { AppError } from "../shared/errors/app-error.js";
import { env } from "./env.js";

export const corsOptions: CorsOptions = {
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID", "RateLimit", "RateLimit-Policy"],
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(
      new AppError({
        statusCode: 403,
        code: "CORS_ORIGIN_DENIED",
        message: "Origin is not allowed by CORS",
      }),
    );
  },
};
