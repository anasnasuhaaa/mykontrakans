import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.cookies.get("mykontrakans_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/bills/:path*", "/history/:path*", "/profile/:path*", "/transactions/:path*", "/payments/:path*", "/categories/:path*", "/members/:path*", "/settings/:path*"],
};
