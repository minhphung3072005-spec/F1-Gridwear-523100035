import { Router } from "express";
import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { cancelCustomerOrderController, checkoutController, getAdminOrderController, getCustomerOrderController, listAdminOrdersController, listCustomerOrdersController, updateAdminOrderStatusController, updateAdminPaymentStatusController } from "./order.controller.js";
import { adminOrderQuerySchema, cancelOrderSchema, checkoutSchema, customerOrderQuerySchema, orderParamsSchema, orderStatusSchema, paymentStatusSchema } from "./order.schema.js";

export const orderRouter = Router();
export const adminOrderRouter = Router();

orderRouter.use(asyncHandler(authenticate), authorize(UserRole.CUSTOMER));
orderRouter.post("/", validateRequest({ body: checkoutSchema }), asyncHandler(checkoutController));
orderRouter.get("/", validateRequest({ query: customerOrderQuerySchema }), asyncHandler(listCustomerOrdersController));
orderRouter.get("/:orderId", validateRequest({ params: orderParamsSchema }), asyncHandler(getCustomerOrderController));
orderRouter.post("/:orderId/cancel", validateRequest({ params: orderParamsSchema, body: cancelOrderSchema }), asyncHandler(cancelCustomerOrderController));

adminOrderRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminOrderRouter.get("/", validateRequest({ query: adminOrderQuerySchema }), asyncHandler(listAdminOrdersController));
adminOrderRouter.get("/:orderId", validateRequest({ params: orderParamsSchema }), asyncHandler(getAdminOrderController));
adminOrderRouter.patch("/:orderId/status", validateRequest({ params: orderParamsSchema, body: orderStatusSchema }), asyncHandler(updateAdminOrderStatusController));
adminOrderRouter.patch("/:orderId/payment-status", validateRequest({ params: orderParamsSchema, body: paymentStatusSchema }), asyncHandler(updateAdminPaymentStatusController));
