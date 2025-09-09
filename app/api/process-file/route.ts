export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log("📄 Processing file:", file.name, "Type:", file.type, "Size:", file.size)

    const fileExtension = file.name.toLowerCase().split(".").pop()
    let extractedContent = ""

    if (fileExtension === "txt" || fileExtension === "md") {
      // Handle plain text files
      extractedContent = await file.text()
    } else if (fileExtension === "pdf") {
      // For PDF files, we'll extract text (simplified approach)
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Simple PDF text extraction (this is basic - for production you'd want a proper PDF parser)
      const text = new TextDecoder().decode(uint8Array)

      // Try to extract readable text from PDF (very basic approach)
      const textMatches = text.match(/[a-zA-Z0-9\s.,!?;:'"()-]+/g)
      if (textMatches) {
        extractedContent = textMatches.join(" ").replace(/\s+/g, " ").trim()
      } else {
        extractedContent =
          "PDF content detected but text extraction failed. Please copy and paste the content manually."
      }
    } else if (fileExtension === "doc" || fileExtension === "docx") {
      // For Word documents (simplified - in production you'd use a proper parser)
      extractedContent =
        "Word document detected. Please copy and paste the content manually, or save as .txt file first."
    } else {
      return Response.json(
        {
          success: false,
          error: "Unsupported file type. Please use .txt, .md, .pdf, .doc, or .docx files.",
        },
        { status: 400 },
      )
    }

    // Clean up the extracted content
    extractedContent = extractedContent.trim()

    if (!extractedContent || extractedContent.length < 50) {
      return Response.json(
        {
          success: false,
          error:
            "Could not extract sufficient text from file. Please try a different file or copy-paste the content manually.",
        },
        { status: 400 },
      )
    }

    console.log("✅ Extracted content length:", extractedContent.length)

    return Response.json({
      success: true,
      content: extractedContent,
      fileName: file.name,
      fileSize: file.size,
      extractedLength: extractedContent.length,
    })
  } catch (error) {
    console.error("❌ File processing error:", error)
    return Response.json(
      {
        success: false,
        error: "Error processing file: " + error.message,
      },
      { status: 500 },
    )
  }
}
