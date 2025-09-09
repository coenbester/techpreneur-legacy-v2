import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { fileContent } = await request.json()

    if (!fileContent) {
      return NextResponse.json({
        success: false,
        error: "No file content provided",
      })
    }

    console.log(`📄 Processing document content (${fileContent.length} characters)`)

    // Truncate content if too long to prevent context window issues
    const MAX_CONTENT_LENGTH = 8000
    let processedContent = fileContent
    let contentTruncated = false

    if (fileContent.length > MAX_CONTENT_LENGTH) {
      processedContent = fileContent.substring(0, MAX_CONTENT_LENGTH)
      contentTruncated = true
      console.log(`✂️ Content truncated from ${fileContent.length} to ${processedContent.length} characters`)
    }

    // Generate a unique seed based on timestamp and random number for variety
    const uniqueSeed = Date.now() + Math.random()
    const sessionId = Math.random().toString(36).substring(2, 15)

    const prompt = `You are an expert business educator creating assessment questions based on course material.

IMPORTANT: Generate UNIQUE and VARIED questions each time. Use different angles, examples, and approaches to test the same concepts.

SESSION ID: ${sessionId}
GENERATION SEED: ${uniqueSeed}

COURSE MATERIAL:
${processedContent}

Create exactly 6 assessment questions that cover different cognitive levels from Bloom's Taxonomy. Each question should be UNIQUE and test different aspects of the material using varied approaches.

REQUIREMENTS:
- Questions 1-5: Generate DIFFERENT questions each time, covering various topics and angles from the material
- Question 6: Always a reflection question, but vary the specific focus and approach
- Use diverse examples, scenarios, and perspectives
- Avoid repetitive phrasing or similar question structures
- Test different sections/concepts from the course material

Return ONLY a valid JSON array with this exact structure:

[
  {
    "id": 1,
    "question": "[UNIQUE Remember-level question about a specific concept from the material]",
    "cognitiveType": "Remember",
    "cognitiveDescription": "Recall and identify key facts and concepts",
    "keyPoints": ["relevant", "key", "concepts"],
    "points": 10
  },
  {
    "id": 2,
    "question": "[UNIQUE Understand-level question with different focus than typical]",
    "cognitiveType": "Understand",
    "cognitiveDescription": "Demonstrate understanding by explaining concepts in your own words",
    "keyPoints": ["relevant", "concepts", "here"],
    "points": 10
  },
  {
    "id": 3,
    "question": "[UNIQUE Apply-level question with specific scenario or case]",
    "cognitiveType": "Apply",
    "cognitiveDescription": "Use knowledge and skills to solve problems in new situations",
    "keyPoints": ["application", "concepts", "here"],
    "points": 10
  },
  {
    "id": 4,
    "question": "[UNIQUE Analyze-level question focusing on different aspects]",
    "cognitiveType": "Analyze",
    "cognitiveDescription": "Break down information and examine relationships between parts",
    "keyPoints": ["analysis", "concepts", "here"],
    "points": 10
  },
  {
    "id": 5,
    "question": "[UNIQUE Evaluate-level question with varied criteria or context]",
    "cognitiveType": "Evaluate",
    "cognitiveDescription": "Make judgments and assess the value of ideas or solutions",
    "keyPoints": ["evaluation", "criteria", "here"],
    "points": 10
  },
  {
    "id": 6,
    "question": "[UNIQUE Reflection question with specific personal/career focus that varies each time]",
    "cognitiveType": "Reflection",
    "cognitiveDescription": "Think deeply about personal application and create connections to your own experience",
    "keyPoints": ["personal application", "career planning", "strategic thinking"],
    "points": 50
  }
]

VARIATION STRATEGIES:
- Focus on different chapters/sections of the material
- Use different business scenarios or examples
- Vary the complexity and depth of questions
- Change the perspective (student, entrepreneur, manager, etc.)
- Use different industries or contexts as examples
- Vary the specific skills or concepts being tested

Make sure each question is relevant to the provided course material and tests the appropriate cognitive level with MAXIMUM VARIETY.`

    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
      temperature: 0.8, // Increased for more question variety
      maxTokens: 3000,
    })

    const aiResponse = result.text.trim()
    console.log(`🤖 AI response length: ${aiResponse.length}`)
    console.log(`🤖 Session ID: ${sessionId}`)
    console.log(`🤖 AI response preview: ${aiResponse.substring(0, 200)}...`)

    // Clean and extract JSON
    let cleanedResponse = aiResponse
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, "").replace(/```\s*/g, "")
    cleanedResponse = cleanedResponse.trim()

    // Find JSON array bounds
    const startIndex = cleanedResponse.indexOf("[")
    const endIndex = cleanedResponse.lastIndexOf("]")

    if (startIndex === -1 || endIndex === -1) {
      console.error("❌ No JSON array found in response")
      console.error("Full response:", aiResponse)
      return NextResponse.json({
        success: false,
        error: "Failed to extract questions from AI response",
        rawResponse: aiResponse,
      })
    }

    const jsonString = cleanedResponse.substring(startIndex, endIndex + 1)
    console.log(`🧹 Extracted JSON: ${jsonString.substring(0, 200)}...`)

    let questions
    try {
      questions = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("❌ JSON parsing failed:", parseError)
      console.error("JSON string:", jsonString)
      return NextResponse.json({
        success: false,
        error: "Failed to parse generated questions",
        rawResponse: aiResponse,
        jsonString: jsonString,
      })
    }

    // Validate questions
    if (!Array.isArray(questions)) {
      console.error("❌ Questions is not an array:", questions)
      return NextResponse.json({
        success: false,
        error: "Generated questions is not an array",
        questions: questions,
      })
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.id || !q.question || !q.cognitiveType || !q.cognitiveDescription || !q.keyPoints || !q.points) {
        console.error(`❌ Invalid question at index ${i}:`, q)
        return NextResponse.json({
          success: false,
          error: `Invalid question structure at index ${i}`,
          question: q,
        })
      }
    }

    console.log(`✅ Successfully generated ${questions.length} unique questions for session ${sessionId}`)

    return NextResponse.json({
      success: true,
      questions: questions,
      metadata: {
        originalContentLength: fileContent.length,
        processedContentLength: processedContent.length,
        contentTruncated: contentTruncated,
        sessionId: sessionId,
        generationSeed: uniqueSeed,
      },
    })
  } catch (error) {
    console.error("❌ Error generating questions:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
