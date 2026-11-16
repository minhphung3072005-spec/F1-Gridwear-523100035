import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import type { CouponValidateInput } from "./coupon.schema.js";
import { validateCouponForCart } from "./coupon.service.js";

export async function validateCouponController(request: Request, response: Response) {
  const input = request.body as CouponValidateInput;
  const preview = await validateCouponForCart(request.auth!.userId, input.code);
  return sendSuccess(response, { message: "Coupon is valid", data: { preview } });
}
