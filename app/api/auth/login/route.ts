export async function GET() {
  return Response.json({
    ok: true,
    message: "Auth login route is deployed. Use POST with { password }.",
    methods: ["POST"],
    envConfigured: Boolean(process.env.ADMIN_PASSWORD), // <- shows if the env var is set on this deployment
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const password = (body?.password as string | undefined) || ""

    // Only use the env var now (no fallback)
    const EXPECTED_PASSWORD = process.env.ADMIN_PASSWORD || ""

    // Clear error if not configured
    if (!EXPECTED_PASSWORD) {
      return Response.json({ success: false, message: "Admin password not configured on server" }, { status: 500 })
    }

    if (!password || password !== EXPECTED_PASSWORD) {
      return Response.json({ success: false, message: "Invalid code" }, { status: 401 })
    }

    const maxAge = 7 * 24 * 60 * 60
    const parts = ["admin_session=1", "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`]
    if (process.env.NODE_ENV !== "development") parts.push("Secure")

    const headers = new Headers()
    headers.append("Set-Cookie", parts.join("; "))

    return new Response(JSON.stringify({ success: true }), { status: 200, headers })
  } catch (err: any) {
    return Response.json({ success: false, message: err?.message || "Login error" }, { status: 500 })
  }
}
