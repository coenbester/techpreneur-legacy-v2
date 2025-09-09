export async function POST() {
  const parts = ["results_session=;", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"]
  if (process.env.NODE_ENV !== "development") parts.push("Secure")

  const headers = new Headers()
  headers.append("Set-Cookie", parts.join("; "))

  return new Response(JSON.stringify({ success: true }), { status: 200, headers })
}
