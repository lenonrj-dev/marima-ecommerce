import { type AdminRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        role: AdminRole | "customer";
        type: "admin" | "customer";
      };
    }
  }
}

export {};
