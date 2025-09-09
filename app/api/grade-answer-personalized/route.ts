import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { studentId, question, answer, questionNumber } = await req.json()

    if (!studentId || !question || !answer) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    console.log("🎯 Starting personalized grading for student:", studentId)

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("student_id", studentId)
      .single()

    if (profileError || !profile) {
      console.log("❌ No profile found, falling back to standard grading")
      return NextResponse.json({ success: false, error: "No profile found" }, { status: 404 })
    }

    console.log("✅ Profile found, generating personalized feedback")

    // Create personalized prompt
    const personalizedPrompt = `
You are an expert entrepreneurship educator providing personalized feedback to a student.

STUDENT PROFILE:
- Qualification: ${profile.qualification_level} in ${profile.qualification_discipline}
- Work Experience: ${profile.work_experience_years}
- Current Role: ${profile.current_role}
- Industry: ${profile.industry}
- Startup Exposure: ${profile.startup_exposure}
- Current Responsibilities: ${profile.current_responsibilities}
- Career Goal (3 years): ${profile.career_goal}
- Biggest Challenge: ${profile.biggest_challenge}

QUESTION: ${question}

STUDENT'S ANSWER: ${answer}

Please provide personalized feedback that:
1. Connects to their specific industry and role
2. References their career goals
3. Addresses their stated challenges
4. Provides actionable next steps relevant to their background
5. Gives a score out of 50 points for this reflection question

Respond in JSON format:
{
  "score": [number out of 50],
  "feedback": "[detailed feedback connecting to their profile]",
  "strengths": "[what they did well, referencing their background]",
  "improvements": "[specific areas to improve, tailored to their goals]",
  "personalizedAdvice": "[career advice specific to their profile]",
  "nextSteps": "[3-5 actionable steps they can take based on their background]",
  "isPersonalized": true
}
`

    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: personalizedPrompt,
      temperature: 0.7,
    })

    console.log("🤖 AI Response received")

    try {
      const gradingResult = JSON.parse(result.text)
      console.log("✅ Personalized grading completed successfully")

      return NextResponse.json({
        success: true,
        ...gradingResult,
        isPersonalized: true,
        profileUsed: true,
      })
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", parseError)
      return NextResponse.json({ success: false, error: "Failed to parse AI response" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ Personalized grading error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
