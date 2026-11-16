import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authRateLimiter, refreshRateLimiter } from "../../middleware/rate-limit.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  asyncHandler(registerController),
);
authRouter.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  asyncHandler(loginController),
);
authRouter.post("/refresh", refreshRateLimiter, asyncHandler(refreshController));
authRouter.post("/logout", refreshRateLimiter, asyncHandler(logoutController));
authRouter.get("/me", asyncHandler(authenticate), asyncHandler(meController));
