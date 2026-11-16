import { Router } from "express";
import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getCustomerController, listCustomersController, updateCustomerStatusController } from "./customer.controller.js";
import { customerListSchema, customerParamsSchema, customerStatusSchema } from "./customer.schema.js";

export const adminCustomerRouter = Router();
adminCustomerRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminCustomerRouter.get("/", validateRequest({ query: customerListSchema }), asyncHandler(listCustomersController));
adminCustomerRouter.get("/:customerId", validateRequest({ params: customerParamsSchema }), asyncHandler(getCustomerController));
adminCustomerRouter.patch("/:customerId/status", validateRequest({ params: customerParamsSchema, body: customerStatusSchema }), asyncHandler(updateCustomerStatusController));
