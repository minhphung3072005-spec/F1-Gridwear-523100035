import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import { paginationMeta } from "../../utils/pagination.js";
import type { AdminCouponInput, AdminCouponListQuery } from "./admin-coupon.schema.js";

const mapCoupon = <T extends { value: { toNumber(): number }; minOrderValue: { toNumber(): number }; maxDiscount: { toNumber(): number } | null }>(coupon: T) => ({ ...coupon, value: coupon.value.toNumber(), minOrderValue: coupon.minOrderValue.toNumber(), maxDiscount: coupon.maxDiscount?.toNumber() ?? null });
const data = (input: AdminCouponInput) => ({ ...input, code: input.code.toUpperCase() });
async function assertUnique(code: string, excludeId?: string) { const item = await prisma.coupon.findFirst({ where: { code, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } }); if (item) throw new AppError({ statusCode: 409, code: "COUPON_CODE_EXISTS", message: "Coupon code already exists" }); }
async function find(id: string) { const coupon = await prisma.coupon.findFirst({ where: { id, deletedAt: null } }); if (!coupon) throw new AppError({ statusCode: 404, code: "RESOURCE_NOT_FOUND", message: "Coupon not found" }); return coupon; }
export async function listAdminCoupons(query: AdminCouponListQuery) { const where: Prisma.CouponWhereInput = { deletedAt: null, ...(query.q ? { code: { contains: query.q } } : {}), ...(query.isActive === undefined ? {} : { isActive: query.isActive }) }; const [records, totalItems] = await prisma.$transaction([prisma.coupon.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }), prisma.coupon.count({ where })]); return { items: records.map(mapCoupon), pagination: paginationMeta(query.page, query.limit, totalItems) }; }
export async function createAdminCoupon(input: AdminCouponInput) { await assertUnique(input.code); return mapCoupon(await prisma.coupon.create({ data: data(input) })); }
export async function updateAdminCoupon(id: string, input: AdminCouponInput) { await find(id); await assertUnique(input.code, id); return mapCoupon(await prisma.coupon.update({ where: { id }, data: data(input) })); }
export async function updateAdminCouponStatus(id: string, isActive: boolean) { await find(id); return mapCoupon(await prisma.coupon.update({ where: { id }, data: { isActive } })); }
export async function deleteAdminCoupon(id: string) { await find(id); const activeRedemptions = await prisma.couponRedemption.count({ where: { couponId: id, status: "APPLIED" } }); if (activeRedemptions) throw new AppError({ statusCode: 409, code: "RESOURCE_IN_USE", message: "Coupon has active redemptions and cannot be deleted" }); await prisma.coupon.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } }); }
