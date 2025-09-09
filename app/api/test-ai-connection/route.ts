import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Testing AI connection directly...")

    // Test OpenAI connection directly instead of making internal fetch
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Respond with exactly: 'AI connection successful'",
          },
        ],
        max_tokens: 10,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ""

    console.log("✅ AI connection test result:", text)

    if (text.includes("AI connection successful")) {
      return NextResponse.json({
        success: true,
        message: "AI system is working correctly",
        response: text,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Unexpected AI response",
        response: text,
      })
    }
  } catch (error) {
    console.error("❌ AI connection test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
