function isAuthedFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return false
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .some((c) => c.startsWith("admin_session=1"))
}

export async function GET(req: Request) {
  const authed = isAuthedFromCookie(req.headers.get("cookie"))
  return Response.json({ authenticated: authed })
}
