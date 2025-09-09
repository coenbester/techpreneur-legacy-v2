import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = body

    console.log("📨 Received messages:", messages?.length)

    if (!messages || messages.length === 0) {
      throw new Error("No messages provided")
    }

    const result = streamText({
      model: openai("gpt-4o"),
      messages: messages,
      system: "You are a helpful assistant.",
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("💥 API ERROR:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}