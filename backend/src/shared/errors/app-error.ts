export type ErrorDetail = {
  field?: string;
  message: string;
  meta?: Record<string, unknown>;
};

type AppErrorOptions = {
  statusCode: number;
  code: string;
  message: string;
  errors?: ErrorDetail[];
  isOperational?: boolean;
  cause?: unknown;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors: ErrorDetail[] | undefined;
  readonly isOperational: boolean;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.errors = options.errors;
    this.isOperational = options.isOperational ?? true;
  }
}
