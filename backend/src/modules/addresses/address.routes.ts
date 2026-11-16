import { Router } from "express";
import { UserRole } from "../../generated/prisma/enums.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createAddressController, deleteAddressController, listAddressesController, setDefaultAddressController, updateAddressController } from "./address.controller.js";
import { addressCreateSchema, addressParamsSchema, addressUpdateSchema } from "./address.schema.js";

export const addressRouter = Router();
addressRouter.use(asyncHandler(authenticate), authorize(UserRole.CUSTOMER));
addressRouter.get("/", asyncHandler(listAddressesController));
addressRouter.post("/", validateRequest({ body: addressCreateSchema }), asyncHandler(createAddressController));
addressRouter.patch("/:addressId", validateRequest({ params: addressParamsSchema, body: addressUpdateSchema }), asyncHandler(updateAddressController));
addressRouter.delete("/:addressId", validateRequest({ params: addressParamsSchema }), asyncHandler(deleteAddressController));
addressRouter.patch("/:addressId/default", validateRequest({ params: addressParamsSchema }), asyncHandler(setDefaultAddressController));
