import { z } from "zod";
import { CouponType } from "../../generated/prisma/enums.js";

const money = z.number().finite().min(0).max(9_999_999_999.99);
const fields = {
  code: z.string().trim().min(2).max(50).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  type: z.nativeEnum(CouponType), value: money, minOrderValue: money, maxDiscount: money.nullable(),
  startAt: z.coerce.date(), endAt: z.coerce.date(), usageLimit: z.number().int().min(1).nullable(),
  perUserLimit: z.number().int().min(1).nullable(), isActive: z.boolean(),
};
const validCoupon = (value: { type: CouponType; value: number; startAt: Date; endAt: Date }) => value.startAt < value.endAt && (value.type !== CouponType.PERCENT || value.value <= 100);
export const couponParamsSchema = z.object({ couponId: z.string().trim().min(1).max(32) });
export const adminCouponListSchema = z.object({ q: z.string().trim().max(100).optional(), isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export const adminCouponCreateSchema = z.object(fields).strict().refine(validCoupon, { message: "Coupon period or percentage value is invalid" });
export const adminCouponUpdateSchema = adminCouponCreateSchema;
export const adminCouponStatusSchema = z.object({ isActive: z.boolean() }).strict();
export type AdminCouponListQuery = z.infer<typeof adminCouponListSchema>;
export type AdminCouponInput = z.infer<typeof adminCouponCreateSchema>;
