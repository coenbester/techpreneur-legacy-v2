import { supabase } from "@/lib/supabase"

// DELETE - Delete a specific document
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const documentId = params.id

    if (!documentId) {
      return Response.json({ success: false, error: "Document ID required" }, { status: 400 })
    }

    // First check if this is the current document
    const { data: currentDoc, error: checkError } = await supabase
      .from("documents")
      .select("is_current")
      .eq("id", documentId)
      .single()

    if (checkError) {
      console.error("Error checking document:", checkError)
      return Response.json({ success: false, error: "Document not found" }, { status: 404 })
    }

    if (currentDoc.is_current) {
      return Response.json(
        { success: false, error: "Cannot delete the current document. Set another document as current first." },
        { status: 400 },
      )
    }

    // Delete the document
    const { error } = await supabase.from("documents").delete().eq("id", documentId)

    if (error) {
      console.error("Database error:", error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("API error:", error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
