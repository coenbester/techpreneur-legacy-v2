import { getCurrentDocument } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("🔍 Testing question generation flow...")

    // Step 1: Get current document (same as the main page does)
    const currentDocument = await getCurrentDocument()

    if (!currentDocument) {
      return Response.json({
        success: false,
        error: "No current document available",
        step: "getCurrentDocument",
      })
    }

    // Step 2: Prepare the data (same as main page does)
    const fileContent = currentDocument.content

    console.log("📄 Document loaded:", {
      title: currentDocument.title,
      contentLength: fileContent?.length || 0,
      contentPreview: fileContent?.substring(0, 100) || "NO CONTENT",
    })

    // Step 3: Test the API call (same as main page does)
    const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileContent: fileContent }),
    })

    const data = await response.json()

    console.log("🤖 API Response:", data)

    return Response.json({
      success: true,
      test: "question-generation-flow",
      document: {
        title: currentDocument.title,
        contentLength: fileContent?.length || 0,
        contentPreview: fileContent?.substring(0, 100),
      },
      apiResponse: data,
      apiSuccess: data.success,
      questionsGenerated: data.questions?.length || 0,
      isFallback: data.fallback || false,
    })
  } catch (error) {
    console.error("❌ Test error:", error)
    return Response.json({
      success: false,
      error: error.message,
      step: "test-questions",
    })
  }
}
