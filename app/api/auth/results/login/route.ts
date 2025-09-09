export async function GET() {
  return Response.json({
    ok: true,
    message: "Results login route is deployed. Use POST with { password }.",
    methods: ["POST"],
    envConfigured: Boolean(process.env.ADMIN_PASSWORD),
  })
}

export async function POST(req: Request) {
  const EXPECTED_RESULTS_PASSWORD = process.env.ADMIN_PASSWORD || ""

  if (!EXPECTED_RESULTS_PASSWORD) {
    return Response.json(
      {
        success: false,
        message: "Access system not configured. Contact administrator.",
      },
      { status: 500 },
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const password = (body?.password as string | undefined) || ""

    if (!password || password !== EXPECTED_RESULTS_PASSWORD) {
      return Response.json({ success: false, message: "Invalid access code" }, { status: 401 })
    }

    // Set a cookie for 7 days that marks Results access
    const maxAge = 7 * 24 * 60 * 60
    const parts = ["results_session=1", "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`]
    if (process.env.NODE_ENV !== "development") parts.push("Secure")

    const headers = new Headers()
    headers.append("Set-Cookie", parts.join("; "))

    return new Response(JSON.stringify({ success: true }), { status: 200, headers })
  } catch (err: any) {
    return Response.json({ success: false, message: err?.message || "Login error" }, { status: 500 })
  }
}
