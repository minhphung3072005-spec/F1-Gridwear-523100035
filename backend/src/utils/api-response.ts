import type { Response } from "express";

type SuccessResponseOptions<T> = {
  statusCode?: number;
  message?: string;
  data: T;
};

export function sendSuccess<T>(
  response: Response,
  options: SuccessResponseOptions<T>,
): Response {
  return response.status(options.statusCode ?? 200).json({
    success: true,
    message: options.message ?? "Success",
    data: options.data,
  });
}

export function sendNoContent(response: Response): Response {
  return response.status(204).send();
}
