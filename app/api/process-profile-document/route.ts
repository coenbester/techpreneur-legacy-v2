export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log("📄 Processing profile document:", file.name, "Type:", file.type, "Size:", file.size)

    const fileExtension = file.name.toLowerCase().split(".").pop()
    let extractedContent = ""

    if (fileExtension === "txt" || fileExtension === "md") {
      extractedContent = await file.text()
    } else if (fileExtension === "pdf") {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const text = new TextDecoder().decode(uint8Array)
      const textMatches = text.match(/[a-zA-Z0-9\s.,!?;:'"()-]+/g)
      if (textMatches) {
        extractedContent = textMatches.join(" ").replace(/\s+/g, " ").trim()
      } else {
        extractedContent = "PDF content detected but text extraction failed."
      }
    } else if (fileExtension === "doc" || fileExtension === "docx") {
      extractedContent = "Word document detected. Please copy and paste the content manually."
    } else {
      return Response.json(
        { success: false, error: "Unsupported file type. Please use .txt, .md, .pdf, .doc, or .docx files." },
        { status: 400 },
      )
    }

    extractedContent = extractedContent.trim()

    if (!extractedContent || extractedContent.length < 50) {
      return Response.json(
        { success: false, error: "Could not extract sufficient text from file. Please try manual entry instead." },
        { status: 400 },
      )
    }

    // Basic profile extraction (this is very simplified - in production you'd use proper AI)
    const extractedProfile = {
      note: "This is a basic extraction. Please review and use manual entry for accuracy.",
      content_length: extractedContent.length,
      suggested_fields: {
        name: "Please extract from document",
        role: "Please extract from document",
        experience: "Please extract from document",
        skills: "Please extract from document",
        goals: "Please extract from document",
      },
    }

    console.log("✅ Profile document processed, content length:", extractedContent.length)

    return Response.json({
      success: true,
      rawContent: extractedContent,
      extractedProfile: extractedProfile,
      fileName: file.name,
      fileSize: file.size,
      message: "Document processed. Please review and use manual entry for accurate profile creation.",
    })
  } catch (error) {
    console.error("❌ Profile document processing error:", error)
    return Response.json({ success: false, error: "Error processing document: " + error.message }, { status: 500 })
  }
}
