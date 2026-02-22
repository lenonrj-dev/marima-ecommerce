import { NextRequest, NextResponse } from "next/server";

const CHECKOUT_PUBLIC_ROUTES = new Set([
  "/checkout/success",
  "/checkout/pending",
  "/checkout/failure",
]);

function hasSessionCookie(request: NextRequest) {
  return request.cookies.has("access_token") || request.cookies.has("marima_access");
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/checkout")) {
    return NextResponse.next();
  }

  if (CHECKOUT_PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  if (hasSessionCookie(request)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/checkout/:path*"],
};
