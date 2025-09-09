import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { question, studentAnswer, keyPoints, fileContent, cognitiveType, studentId } = await request.json()

    if (!question || !studentAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`🎯 Grading ${cognitiveType} question for student:`, studentId)
    console.log(`📝 Question: ${question.substring(0, 100)}...`)
    console.log(`📝 Answer length: ${studentAnswer.length} characters`)

    // Check if this is a reflection question and if student has a profile for personalization
    let usePersonalizedFeedback = false
    let studentProfile = null

    if (cognitiveType === "Reflection" && studentId) {
      try {
        console.log("🔍 Checking for student profile for personalized feedback...")
        const { data: profile, error: profileError } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("student_id", studentId)
          .single()

        if (!profileError && profile) {
          usePersonalizedFeedback = true
          studentProfile = profile
          console.log("✅ Student profile found - enabling personalized feedback")
        } else {
          console.log("📝 No profile found - using standard feedback")
        }
      } catch (profileError) {
        console.log("❌ Error checking profile:", profileError)
      }
    }

    let prompt = ""

    if (usePersonalizedFeedback && studentProfile) {
      // PERSONALIZED REFLECTION FEEDBACK
      console.log("🎯 Generating personalized reflection feedback")
      prompt = `
You are an expert entrepreneurship educator providing personalized feedback to a student based on their profile.

STUDENT PROFILE:
- Qualification: ${studentProfile.qualification_level} in ${studentProfile.qualification_discipline}
- Work Experience: ${studentProfile.work_experience_years} years
- Current Role: ${studentProfile.current_role}
- Industry: ${studentProfile.industry}
- Startup Exposure: ${studentProfile.startup_exposure}
- Current Responsibilities: ${studentProfile.current_responsibilities}
- Career Goal (3 years): ${studentProfile.career_goal}
- Biggest Challenge: ${studentProfile.biggest_challenge}

REFLECTION QUESTION: ${question}

STUDENT'S ANSWER: ${studentAnswer}

Please provide personalized feedback that:
1. Connects directly to their specific industry (${studentProfile.industry}) and role (${studentProfile.current_role})
2. References their career goals: ${studentProfile.career_goal}
3. Addresses their stated challenge: ${studentProfile.biggest_challenge}
4. Provides actionable next steps relevant to their ${studentProfile.work_experience_years} years of experience
5. Considers their startup exposure level: ${studentProfile.startup_exposure}

IMPORTANT: Respond with ONLY the JSON object, no markdown formatting or code blocks.

{
  "score": [number out of 50 for reflection questions],
  "feedback": "[detailed feedback connecting concepts to their specific profile and industry]",
  "strengths": "[what they did well, referencing their background and experience]",
  "improvements": "[specific areas to improve, tailored to their career goals and current challenges]",
  "personalizedAdvice": "[career advice specific to their industry, role, and goals]",
  "nextSteps": "[3-5 actionable steps they can take based on their profile]",
  "personalized": true,
  "profileUsed": true
}
`
    } else {
      // STANDARD FEEDBACK
      console.log("📝 Generating standard feedback")
      const maxScore = cognitiveType === "Reflection" ? 50 : 10

      prompt = `
You are an expert business educator. Grade this student's answer to a ${cognitiveType} question.

QUESTION: ${question}
STUDENT ANSWER: ${studentAnswer}
KEY POINTS TO LOOK FOR: ${keyPoints?.join(", ") || "N/A"}
COGNITIVE LEVEL: ${cognitiveType}
MAX SCORE: ${maxScore}

${fileContent ? `REFERENCE MATERIAL: ${fileContent.substring(0, 2000)}` : ""}

IMPORTANT: Respond with ONLY the JSON object, no markdown formatting or code blocks.

{
  "score": [number out of ${maxScore}],
  "feedback": "[detailed explanation of the grade]",
  "strengths": "[what the student did well]",
  "improvements": "[specific areas for improvement]",
  "personalized": false,
  "profileUsed": false
}
`
    }

    console.log("🤖 Calling AI for grading...")
    console.log("🔑 Using model: gpt-4o")

    try {
      const result = await generateText({
        model: openai("gpt-4o"),
        prompt,
        temperature: 0.7,
      })

      console.log("✅ AI response received")
      console.log("📄 Response length:", result.text?.length || 0)
      console.log("📄 Raw response:", result.text?.substring(0, 300) || "No text")

      if (!result.text) {
        throw new Error("AI returned empty response")
      }

      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = result.text.trim()
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      console.log("🧹 Cleaned response:", cleanedResponse.substring(0, 300))

      console.log(`✅ Generated ${usePersonalizedFeedback ? "personalized" : "standard"} feedback`)

      return NextResponse.json({
        success: true,
        grading: cleanedResponse,
        isPersonalized: usePersonalizedFeedback,
        profileUsed: usePersonalizedFeedback,
      })
    } catch (aiError) {
      console.error("❌ AI SDK Error:", aiError)
      console.error("❌ AI Error details:", {
        message: aiError instanceof Error ? aiError.message : "Unknown AI error",
        stack: aiError instanceof Error ? aiError.stack : undefined,
      })

      return NextResponse.json(
        {
          success: false,
          error: `AI grading failed: ${aiError instanceof Error ? aiError.message : "Unknown AI error"}`,
          details: "Check server logs for more information",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Grading error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to grade answer: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
