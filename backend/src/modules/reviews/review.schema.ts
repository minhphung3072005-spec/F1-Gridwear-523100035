import { z } from "zod";
import { ReviewStatus } from "../../generated/prisma/enums.js";

export const reviewParamsSchema = z.object({ reviewId: z.string().trim().min(1).max(32) });
export const reviewListSchema = z.object({
  q: z.string().trim().max(100).optional(), status: z.nativeEnum(ReviewStatus).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(), page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const reviewStatusSchema = z.object({ status: z.nativeEnum(ReviewStatus) }).strict();
export const reviewCreateSchema = z.object({
  orderItemId: z.string().trim().min(1).max(32),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(150).nullable().optional(),
  content: z.string().trim().min(5).max(5000).nullable().optional(),
}).strict();
export type ReviewListQuery = z.infer<typeof reviewListSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
