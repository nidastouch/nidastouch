import { NextResponse, type NextRequest } from "next/server";

/**
 * Domain routing:
 *   leonidastouch.com  → the studio site (served at "/")
 *   nidastouch.com     → the nidas store (rewritten to the "/nidas" tree)
 *
 * One deployment serves both. On the nidas host, requests that are not already
 * under /nidas get rewritten into the /nidas tree, so nidastouch.com/ shows the
 * store homepage. Internal store links already use /nidas/... so they pass
 * straight through.
 *
 * Note: exact host matching — "leonidastouch.com" literally contains the
 * substring "nidastouch.com", so we must compare full hostnames.
 */
export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const isNidasHost = host === "nidastouch.com" || host === "www.nidastouch.com";

  if (!isNidasHost) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Already in the store tree, or an asset/api route — leave it alone.
  if (
    pathname.startsWith("/nidas") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? "/nidas" : `/nidas${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
