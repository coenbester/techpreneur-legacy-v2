import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { documentId } = await req.json()

    if (!documentId) {
      return Response.json({ success: false, error: "Document ID required" }, { status: 400 })
    }

    // First, set all documents to not current
    const { error: updateAllError } = await supabase
      .from("documents")
      .update({ is_current: false })
      .neq("id", "00000000-0000-0000-0000-000000000000") // Update all rows

    if (updateAllError) {
      console.error("Error updating all documents:", updateAllError)
      return Response.json({ success: false, error: updateAllError.message }, { status: 500 })
    }

    // Then set the selected document as current
    const { data, error } = await supabase
      .from("documents")
      .update({ is_current: true })
      .eq("id", documentId)
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
