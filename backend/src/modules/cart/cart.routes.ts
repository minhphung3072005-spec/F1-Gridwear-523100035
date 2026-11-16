import { Router } from "express";

import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  addCartItemController,
  clearCartController,
  getCartController,
  mergeCartController,
  removeCartItemController,
  updateCartItemController,
} from "./cart.controller.js";
import {
  cartItemCreateSchema,
  cartItemParamsSchema,
  cartItemUpdateSchema,
  cartMergeSchema,
} from "./cart.schema.js";

export const cartRouter = Router();

cartRouter.use(asyncHandler(authenticate), authorize(UserRole.CUSTOMER));
cartRouter.get("/", asyncHandler(getCartController));
cartRouter.post(
  "/items",
  validateRequest({ body: cartItemCreateSchema }),
  asyncHandler(addCartItemController),
);
cartRouter.patch(
  "/items/:itemId",
  validateRequest({ params: cartItemParamsSchema, body: cartItemUpdateSchema }),
  asyncHandler(updateCartItemController),
);
cartRouter.delete(
  "/items/:itemId",
  validateRequest({ params: cartItemParamsSchema }),
  asyncHandler(removeCartItemController),
);
cartRouter.delete("/items", asyncHandler(clearCartController));
cartRouter.post(
  "/merge",
  validateRequest({ body: cartMergeSchema }),
  asyncHandler(mergeCartController),
);
