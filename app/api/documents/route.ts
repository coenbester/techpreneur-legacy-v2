import { supabase } from "@/lib/supabase"

// GET - Fetch all documents
export async function GET() {
  try {
    const { data, error } = await supabase.from("documents").select("*").order("week_number", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      documents: data || [],
    })
  } catch (error) {
    console.error("API error:", error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Add new document
export async function POST(req: Request) {
  try {
    const { title, content, weekNumber } = await req.json()

    if (!title || !content || !weekNumber) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          title,
          content,
          week_number: weekNumber,
          is_current: false, // New documents are not current by default
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      document: data,
    })
  } catch (error) {
    console.error("API error:", error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
