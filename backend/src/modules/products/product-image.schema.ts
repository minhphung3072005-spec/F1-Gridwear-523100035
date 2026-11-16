import { z } from "zod";
export const productImageParamsSchema = z.object({ productId: z.string().trim().min(1).max(32) });
export const imageParamsSchema = z.object({ productId: z.string().trim().min(1).max(32), imageId: z.string().trim().min(1).max(32) });
export const productImageCreateSchema = z.object({ url: z.string().trim().url().max(2048), altText: z.string().trim().max(255).nullable().optional(), isPrimary: z.boolean().default(false) }).strict();
export type ProductImageCreateInput = z.infer<typeof productImageCreateSchema>;
