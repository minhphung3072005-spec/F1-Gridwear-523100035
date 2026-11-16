import { z } from "zod";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../../generated/prisma/enums.js";

const id = z.string().trim().min(1).max(32);
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

export const orderParamsSchema = z.object({ orderId: id });
export const idempotencyKeySchema = z.string().uuid().max(64);

export const checkoutSchema = z.object({
  shippingAddressId: id,
  couponCode: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()).optional(),
  paymentMethod: z.literal(PaymentMethod.COD),
  note: z.string().trim().max(500).nullable().optional(),
}).strict();

export const customerOrderQuerySchema = z.object({ status: z.nativeEnum(OrderStatus).optional(), page, limit });
export const cancelOrderSchema = z.object({ reason: z.string().trim().min(3).max(500) }).strict();

export const adminOrderQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page,
  limit,
}).refine(({ from, to }) => !from || !to || from <= to, { path: ["to"], message: "to must be greater than or equal to from" });

export const orderStatusSchema = z.object({ status: z.nativeEnum(OrderStatus), note: z.string().trim().max(500).optional() }).strict();
export const paymentStatusSchema = z.object({ status: z.nativeEnum(PaymentStatus) }).strict();

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CustomerOrderQuery = z.infer<typeof customerOrderQuerySchema>;
export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
export type PaymentStatusInput = z.infer<typeof paymentStatusSchema>;
