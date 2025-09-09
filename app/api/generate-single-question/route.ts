export async function POST(req: Request) {
  try {
    const { fileContent } = await req.json()

    console.log("🎯 Generating question from content...")
    console.log("📄 First 200 chars:", fileContent.substring(0, 200))

    // Create a question based on the actual content
    const words = fileContent.toLowerCase().split(/\s+/)
    const uniqueWords = [...new Set(words)].filter(word => word.length > 4)
    
    let question
    if (uniqueWords.length > 0) {
      const randomWord = uniqueWords[Math.floor(Math.random() * Math.min(10, uniqueWords.length))]
      question = `What role does "${randomWord}" play in this document?`
    } else {
      question = "What is the main topic discussed in this document?"
    }

    console.log("✅ Question generated:", question)

    return Response.json({
      question: question,
      success: true,
      contentBased: true,
    })
  } catch (error) {
    console.error("❌ Question generation error:", error)

    return Response.json({
      question: "What is the main topic discussed in the document?",
      success: true,
      fallback: true,
    })
  }
}
