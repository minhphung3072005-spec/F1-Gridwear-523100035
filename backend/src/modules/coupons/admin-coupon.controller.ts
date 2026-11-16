import type { Request, Response } from "express";
import { sendNoContent, sendSuccess } from "../../utils/api-response.js";
import type { AdminCouponInput, AdminCouponListQuery } from "./admin-coupon.schema.js";
import { createAdminCoupon, deleteAdminCoupon, listAdminCoupons, updateAdminCoupon, updateAdminCouponStatus } from "./admin-coupon.service.js";
export async function listAdminCouponsController(request: Request, response: Response) { return sendSuccess(response, { message: "Coupons fetched successfully", data: await listAdminCoupons(request.query as unknown as AdminCouponListQuery) }); }
export async function createAdminCouponController(request: Request, response: Response) { return sendSuccess(response, { statusCode: 201, message: "Coupon created successfully", data: { coupon: await createAdminCoupon(request.body as AdminCouponInput) } }); }
export async function updateAdminCouponController(request: Request, response: Response) { return sendSuccess(response, { message: "Coupon updated successfully", data: { coupon: await updateAdminCoupon(request.params.couponId as string, request.body as AdminCouponInput) } }); }
export async function updateAdminCouponStatusController(request: Request, response: Response) { return sendSuccess(response, { message: "Coupon status updated successfully", data: { coupon: await updateAdminCouponStatus(request.params.couponId as string, request.body.isActive as boolean) } }); }
export async function deleteAdminCouponController(request: Request, response: Response) { await deleteAdminCoupon(request.params.couponId as string); return sendNoContent(response); }
