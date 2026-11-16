import { CouponRedemptionStatus, CouponType, ProductStatus } from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { effectiveUnitPrice } from "../cart/cart.service.js";

type DbClient = Prisma.TransactionClient | typeof prisma;
const money = (value: number) => Math.round(value * 100) / 100;

export async function calculateCoupon(client: DbClient, userId: string, code: string, subtotal: number) {
  const now = new Date();
  const coupon = await client.coupon.findFirst({ where: { code: code.toUpperCase(), isActive: true, deletedAt: null } });
  if (!coupon) throw new AppError({ statusCode: 422, code: "COUPON_INVALID", message: "Coupon is invalid or inactive" });
  if (coupon.startAt > now || coupon.endAt < now) throw new AppError({ statusCode: 422, code: "COUPON_EXPIRED", message: "Coupon is outside its valid period" });
  if (subtotal < coupon.minOrderValue.toNumber()) throw new AppError({ statusCode: 422, code: "COUPON_MINIMUM_NOT_MET", message: `Order subtotal must be at least ${coupon.minOrderValue.toNumber()}` });
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new AppError({ statusCode: 409, code: "COUPON_USAGE_LIMIT_REACHED", message: "Coupon usage limit has been reached" });
  if (coupon.perUserLimit !== null) {
    const used = await client.couponRedemption.count({ where: { couponId: coupon.id, userId, status: CouponRedemptionStatus.APPLIED } });
    if (used >= coupon.perUserLimit) throw new AppError({ statusCode: 409, code: "COUPON_USER_LIMIT_REACHED", message: "Coupon usage limit for this customer has been reached" });
  }
  let discount = coupon.type === CouponType.PERCENT ? subtotal * coupon.value.toNumber() / 100 : coupon.value.toNumber();
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount.toNumber());
  discount = money(Math.min(discount, subtotal));
  return { coupon, discount };
}

export async function validateCouponForCart(userId: string, code: string) {
  const cart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { variant: { include: { product: true } } } } } });
  if (!cart || cart.items.length === 0) throw new AppError({ statusCode: 422, code: "CART_EMPTY", message: "Cart is empty" });
  let subtotal = 0;
  for (const item of cart.items) {
    const variant = item.variant;
    if (!variant.isActive || variant.deletedAt || variant.product.status !== ProductStatus.ACTIVE || variant.product.deletedAt || variant.stock < item.quantity) {
      throw new AppError({ statusCode: 409, code: "CART_UNAVAILABLE", message: "Cart contains an unavailable item" });
    }
    subtotal += effectiveUnitPrice({ productBasePrice: variant.product.basePrice.toNumber(), productSalePrice: variant.product.salePrice?.toNumber() ?? null, variantPrice: variant.price?.toNumber() ?? null, variantSalePrice: variant.salePrice?.toNumber() ?? null }) * item.quantity;
  }
  subtotal = money(subtotal);
  const result = await calculateCoupon(prisma, userId, code, subtotal);
  const shippingFee = subtotal >= 2_000_000 ? 0 : 50_000;
  return { code: result.coupon.code, subtotal, discount: result.discount, shippingFee, total: money(subtotal - result.discount + shippingFee) };
}
