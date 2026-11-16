import type { UserRole } from "../generated/prisma/enums.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export {};
