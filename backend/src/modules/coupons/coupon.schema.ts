import { z } from "zod";

export const couponValidateSchema = z.object({ code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()) }).strict();
export type CouponValidateInput = z.infer<typeof couponValidateSchema>;
