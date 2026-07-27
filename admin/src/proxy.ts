import { NextResponse, type NextRequest } from "next/server";
import { userFromToken } from "@/lib/auth-user";
import { TOKEN_COOKIE } from "@/lib/token";

// Route protection at the edge. In Next.js 16 this file convention is "Proxy"
// (the renamed Middleware — same behaviour). It runs before every matched
// request, reads the JWT cookie, and decides access from the decoded claims
// (present + not expired + role ADMIN).
//
// This is an optimistic UX gate: the API still verifies the token's signature
// on every call, so a forged/edited cookie gets nothing from the backend. Proxy
// just keeps unauthenticated users out of admin pages and signed-in admins off
// the login page — it is not the authorization boundary.
const PUBLIC_PATHS = ["/login"];

export function proxy(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value ?? null;
  const user = userFromToken(token);
  const isAdmin = user?.role === "ADMIN";

  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // Not signed in → keep out of protected pages.
  if (!isAdmin && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already signed in → skip the login page.
  if (isAdmin && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Run on everything except Next internals and static assets.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
