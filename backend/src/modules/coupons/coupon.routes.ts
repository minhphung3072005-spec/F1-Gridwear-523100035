import { Router } from "express";
import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { validateCouponController } from "./coupon.controller.js";
import { couponValidateSchema } from "./coupon.schema.js";

export const couponRouter = Router();
couponRouter.use(asyncHandler(authenticate), authorize(UserRole.CUSTOMER));
couponRouter.post("/validate", validateRequest({ body: couponValidateSchema }), asyncHandler(validateCouponController));
