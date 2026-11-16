import { z } from "zod";

const optionalUrl = z.string().trim().url().max(2048).nullable().optional();

export const brandParamsSchema = z.object({ brandId: z.string().trim().min(1).max(32) });
export const brandSlugParamsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

export const brandListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const brandCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(1).max(120).optional(),
    logoUrl: optionalUrl,
    description: z.string().trim().max(5000).nullable().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(10000).default(0),
  })
  .strict();

export const brandUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(1).max(120).optional(),
    logoUrl: optionalUrl,
    description: z.string().trim().max(5000).nullable(),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(10000),
  })
  .strict();

export type BrandListQuery = z.infer<typeof brandListQuerySchema>;
export type BrandCreateInput = z.infer<typeof brandCreateSchema>;
export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>;
