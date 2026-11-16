import { z } from "zod";

export const customerParamsSchema = z.object({ customerId: z.string().trim().min(1).max(32) });
export const customerListSchema = z.object({
  q: z.string().trim().max(100).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const customerStatusSchema = z.object({ isActive: z.boolean() }).strict();

export type CustomerListQuery = z.infer<typeof customerListSchema>;
export type CustomerStatusInput = z.infer<typeof customerStatusSchema>;
