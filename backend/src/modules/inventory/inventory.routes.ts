import { Router } from "express";

import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  adjustInventoryController,
  importInventoryController,
  listInventoryController,
  listInventoryTransactionsController,
} from "./inventory.controller.js";
import {
  inventoryAdjustmentSchema,
  inventoryImportSchema,
  inventoryListQuerySchema,
  inventoryParamsSchema,
  inventoryTransactionQuerySchema,
} from "./inventory.schema.js";

export const adminInventoryRouter = Router();

adminInventoryRouter.use(asyncHandler(authenticate), authorize(UserRole.ADMIN));
adminInventoryRouter.get(
  "/",
  validateRequest({ query: inventoryListQuerySchema }),
  asyncHandler(listInventoryController),
);
adminInventoryRouter.post(
  "/imports",
  validateRequest({ body: inventoryImportSchema }),
  asyncHandler(importInventoryController),
);
adminInventoryRouter.get(
  "/:variantId/transactions",
  validateRequest({ params: inventoryParamsSchema, query: inventoryTransactionQuerySchema }),
  asyncHandler(listInventoryTransactionsController),
);
adminInventoryRouter.patch(
  "/:variantId",
  validateRequest({ params: inventoryParamsSchema, body: inventoryAdjustmentSchema }),
  asyncHandler(adjustInventoryController),
);
