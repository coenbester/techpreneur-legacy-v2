import { getCurrentDocument } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Testing document loading...")

    // Test 1: Can we get the current document?
    const doc = await getCurrentDocument()
    console.log("📄 Current document:", doc)

    if (!doc) {
      return Response.json({
        success: false,
        error: "No current document found",
        step: "getCurrentDocument",
      })
    }

    // Test 2: Check the content
    const contentLength = doc.content?.length || 0
    const contentPreview = doc.content?.substring(0, 200) || "NO CONTENT"

    console.log("📊 Content analysis:", {
      length: contentLength,
      preview: contentPreview,
    })

    return Response.json({
      success: true,
      document: {
        id: doc.id,
        title: doc.title,
        week_number: doc.week_number,
        contentLength: contentLength,
        contentPreview: contentPreview,
        hasContent: contentLength > 50,
      },
      tests: {
        documentExists: !!doc,
        hasTitle: !!doc.title,
        hasContent: contentLength > 0,
        contentLongEnough: contentLength > 50,
      },
    })
  } catch (error) {
    console.error("❌ Test error:", error)
    return Response.json({
      success: false,
      error: error.message,
      step: "test-document",
    })
  }
}
