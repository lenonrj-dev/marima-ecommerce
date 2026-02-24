import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import {
  clearAuthCookies,
  loginAdmin,
  loginCustomer,
  meFromPayload,
  registerCustomer,
  setAuthCookies,
  verifyRefreshToken,
} from "../services/auth.service";
import { LEGACY_REFRESH_COOKIE, REFRESH_COOKIE } from "../middlewares/auth";
import { bindGuestCartToCustomer, GUEST_CART_COOKIE } from "../services/carts.service";
import { cookieBaseOptions } from "../utils/cookies";

export const registerCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerCustomer(req.body);

  const guestToken = req.cookies?.[GUEST_CART_COOKIE];
  if (typeof guestToken === "string" && guestToken) {
    try {
      await bindGuestCartToCustomer(guestToken, String(user.id));
      res.clearCookie(GUEST_CART_COOKIE, cookieBaseOptions(req));
    } catch {
      // Ignore cart merge failures.
    }
  }

  setAuthCookies(
    res,
    {
      sub: String(user.id),
      role: "customer",
      type: "customer",
    },
    req,
  );

  res.status(201).json({
    data: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      segment: user.segment,
      createdAt: user.createdAt?.toISOString(),
    },
  });
});

export const loginCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await loginCustomer(req.body);

  const guestToken = req.cookies?.[GUEST_CART_COOKIE];
  if (typeof guestToken === "string" && guestToken) {
    try {
      await bindGuestCartToCustomer(guestToken, String(user.id));
      res.clearCookie(GUEST_CART_COOKIE, cookieBaseOptions(req));
    } catch {
      // Ignore cart merge failures.
    }
  }

  setAuthCookies(
    res,
    {
      sub: String(user.id),
      role: "customer",
      type: "customer",
    },
    req,
  );

  res.json({
    data: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      segment: user.segment,
    },
  });
});

export const loginAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await loginAdmin(req.body);

  setAuthCookies(
    res,
    {
      sub: String(user.id),
      role: user.role,
      type: "admin",
    },
    req,
  );

  res.json({
    data: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    },
  });
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  clearAuthCookies(res, req);
  res.json({ data: { success: true } });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const refresh = req.cookies?.[REFRESH_COOKIE] || req.cookies?.[LEGACY_REFRESH_COOKIE];
  if (!refresh) {
    res.status(401).json({ code: "AUTH_REQUIRED", message: "Não autenticado." });
    return;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refresh);
  } catch {
    clearAuthCookies(res, req);
    res.status(401).json({ code: "AUTH_EXPIRED", message: "Sessão expirada." });
    return;
  }

  setAuthCookies(res, payload, req);
  res.json({ data: { success: true } });
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    res.status(401).json({ code: "AUTH_REQUIRED", message: "Não autenticado." });
    return;
  }

  const me = await meFromPayload(req.auth as any);
  res.json({
    data: {
      ...me,
      type: me.type,
      userType: me.type,
    },
  });
});

