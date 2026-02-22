import { Role } from "../models/AdminUser";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        role: Role | "customer";
        type: "admin" | "customer";
      };
    }
  }
}

export {};
