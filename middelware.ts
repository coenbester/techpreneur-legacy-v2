import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow API routes to pass through without redirection
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Allow static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/approved-students.csv") ||
    pathname.startsWith("/static-test.html")
  ) {
    return NextResponse.next()
  }

  // Allow admin routes
  if (pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // Allow test routes
  if (
    pathname.startsWith("/test") ||
    pathname.startsWith("/debug") ||
    pathname.startsWith("/simple-debug") ||
    pathname.startsWith("/working-test") ||
    pathname.startsWith("/test-routing") ||
    pathname.startsWith("/results") ||
    pathname.startsWith("/manual-comparison") ||
    pathname.startsWith("/manual-scoring")
  ) {
    return NextResponse.next()
  }

  // For the root path, continue to the main page
  if (pathname === "/") {
    return NextResponse.next()
  }

  // For any other path, redirect to home
  return NextResponse.redirect(new URL("/", request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
