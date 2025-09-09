// Checks if the browser has the Results-only cookie set.
function isResultsAuthed(cookieHeader: string | null) {
  if (!cookieHeader) return false
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .some((c) => c.startsWith("results_session=1"))
}

export async function GET(req: Request) {
  const authed = isResultsAuthed(req.headers.get("cookie"))
  return Response.json({ authenticated: authed })
}
