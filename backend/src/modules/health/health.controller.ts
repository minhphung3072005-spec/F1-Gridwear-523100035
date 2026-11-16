import type { Request, Response } from "express";

import { env } from "../../config/env.js";
import { sendSuccess } from "../../utils/api-response.js";

export function getHealth(_request: Request, response: Response): Response {
  return sendSuccess(response, {
    message: "F1 Fashion Store API is healthy",
    data: {
      service: "f1-fashion-store-api",
      status: "ok",
      version: "0.1.0",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
}
