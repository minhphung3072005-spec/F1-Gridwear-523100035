import { z } from "zod";

const optionalUrl = z.string().trim().url().max(2048).nullable().optional();

export const categoryParamsSchema = z.object({ categoryId: z.string().trim().min(1).max(32) });
export const categorySlugParamsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

export const categoryListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const categoryCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    imageUrl: optionalUrl,
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(10000).default(0),
  })
  .strict();

export const categoryUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(5000).nullable(),
    imageUrl: optionalUrl,
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(10000),
  })
  .strict();

export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
