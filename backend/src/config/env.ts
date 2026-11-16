import "dotenv/config";

import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: z.string().url().startsWith("mysql://"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().optional(),
  API_PREFIX: z.string().startsWith("/").default("/api/v1"),
  JSON_BODY_LIMIT: z.string().default("1mb"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
  TRUST_PROXY: booleanFromString,
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),
  JWT_ISSUER: z.string().min(1).default("f1-fashion-store-api"),
  JWT_AUDIENCE: z.string().min(1).default("f1-fashion-store-web"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60),
  REFRESH_COOKIE_NAME: z.string().min(1).default("f1_refresh"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${issues}`);
}

const configuredOrigins = parsedEnv.data.CORS_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = Object.freeze({
  ...parsedEnv.data,
  CORS_ORIGINS:
    configuredOrigins && configuredOrigins.length > 0
      ? configuredOrigins
      : [parsedEnv.data.FRONTEND_URL],
});

export type Environment = typeof env;
