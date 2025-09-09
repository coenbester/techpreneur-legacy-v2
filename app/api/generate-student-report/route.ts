import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { studentData, questions, results, currentDocument } = await request.json()

    if (!studentData || !questions || !results) {
      return NextResponse.json({
        success: false,
        error: "Missing required data for report generation",
      })
    }

    console.log("📊 Generating comprehensive student report...")

    // Calculate performance metrics
    const totalScore = results.reduce((sum: number, r: any) => sum + (r.score || 0), 0)
    const totalPossible = questions.reduce(
      (sum: number, q: any) => sum + (q.cognitiveType === "Reflection" ? 50 : 10),
      0,
    )
    const overallPercentage = totalPossible > 0 ? ((totalScore / totalPossible) * 100).toFixed(1) : "0.0"

    // Cognitive breakdown
    const cognitiveBreakdown: { [key: string]: { score: number; possible: number; percentage: string } } = {}

    results.forEach((result: any) => {
      const cogType = result.cognitiveType || "Unknown"
      const maxPoints = result.cognitiveType === "Reflection" ? 50 : 10

      if (!cognitiveBreakdown[cogType]) {
        cognitiveBreakdown[cogType] = { score: 0, possible: 0, percentage: "0.0" }
      }

      cognitiveBreakdown[cogType].score += result.score || 0
      cognitiveBreakdown[cogType].possible += maxPoints
    })

    // Calculate percentages for each cognitive type
    Object.keys(cognitiveBreakdown).forEach((cogType) => {
      const breakdown = cognitiveBreakdown[cogType]
      breakdown.percentage = breakdown.possible > 0 ? ((breakdown.score / breakdown.possible) * 100).toFixed(1) : "0.0"
    })

    // Helper function to safely convert any value to string
    const safeStringify = (value: any): string => {
      if (typeof value === "string") return value
      if (Array.isArray(value)) return value.join("\n")
      if (typeof value === "object" && value !== null) return JSON.stringify(value, null, 2)
      return String(value || "")
    }

    // Helper function to safely truncate text
    const safeTruncate = (value: any, length = 200): string => {
      const str = safeStringify(value)
      return str.length > length ? str.substring(0, length) + "..." : str
    }

    // Create complete assessment backup section
    const completeAssessmentBackup = results
      .map((result: any, index: number) => {
        const question = questions.find((q: any) => q.id === result.questionId)
        let section = `
QUESTION ${result.questionId}: ${question?.cognitiveType || "Unknown"} Level
Maximum Points: ${result.cognitiveType === "Reflection" ? "50" : "10"}
Cognitive Type: ${result.cognitiveType}

QUESTION TEXT:
${result.question}

YOUR ANSWER:
${result.answer}

SCORE RECEIVED: ${result.score}/${result.cognitiveType === "Reflection" ? "50" : "10"} points

AI FEEDBACK:
${result.feedback}

STRENGTHS IDENTIFIED:
${result.strengths}

AREAS FOR IMPROVEMENT:
${result.improvements}`

        // Add personalized content if available
        if (result.personalizedAdvice) {
          section += `

PERSONALIZED CAREER ADVICE:
${safeStringify(result.personalizedAdvice)}`
        }

        if (result.nextSteps) {
          section += `

PERSONALIZED NEXT STEPS:
${safeStringify(result.nextSteps)}`
        }

        section += `

${"=".repeat(100)}`

        return section
      })
      .join("\n")

    // Create detailed Q&A section for analysis (shorter version)
    const qaSection = results
      .map((result: any, index: number) => {
        const question = questions.find((q: any) => q.id === result.questionId)
        return `Q${result.questionId} (${question?.cognitiveType}): ${result.score}/${result.cognitiveType === "Reflection" ? "50" : "10"} - ${safeTruncate(result.feedback, 150)}`
      })
      .join("\n")

    // Check if we have any personalized content
    const hasPersonalizedContent = results.some((r: any) => r.personalizedAdvice || r.nextSteps)
    const personalizedSummary = hasPersonalizedContent
      ? results
          .filter((r: any) => r.personalizedAdvice || r.nextSteps)
          .map((r: any) => {
            let summary = `Question ${r.questionId} (${r.cognitiveType}):`
            if (r.personalizedAdvice) {
              summary += `\n- Career Advice: ${safeTruncate(r.personalizedAdvice)}`
            }
            if (r.nextSteps) {
              summary += `\n- Next Steps: ${safeTruncate(r.nextSteps)}`
            }
            return summary
          })
          .join("\n\n")
      : "No personalized content available for this assessment."

    const reportPrompt = `You are an expert educational analyst creating a comprehensive student performance report.

STUDENT INFORMATION:
Name: ${studentData.name} ${studentData.surname}
Student Number: ${studentData.studentNumber}
Assessment: ${currentDocument?.title || "Business Assessment"}
Date: ${new Date().toLocaleDateString()}

PERFORMANCE SUMMARY:
Overall Score: ${overallPercentage}%
Points Earned: ${totalScore}/${totalPossible}
Questions Completed: ${results.length}

COGNITIVE BREAKDOWN:
${Object.entries(cognitiveBreakdown)
  .map(([cogType, data]) => `${cogType}: ${data.score}/${data.possible} points (${data.percentage}%)`)
  .join("\n")}

PERSONALIZED CONTENT SUMMARY:
${personalizedSummary}

QUESTION SUMMARY FOR ANALYSIS:
${qaSection}

Based on this comprehensive assessment data, create a detailed performance report that includes:

1. EXECUTIVE SUMMARY
   - Overall performance assessment
   - Key strengths and achievements
   - Primary areas needing attention

2. COGNITIVE SKILLS ANALYSIS
   - Performance by Bloom's Taxonomy level
   - Specific insights for each cognitive skill
   - Learning progression recommendations

3. DETAILED FEEDBACK SYNTHESIS
   - Common themes across all responses
   - Specific examples of strong performance
   - Targeted improvement strategies

4. PERSONALIZED INSIGHTS & RECOMMENDATIONS
   ${
     hasPersonalizedContent
       ? "- Incorporate the personalized career advice and next steps provided\n   - Connect the personalized recommendations to overall performance patterns\n   - Provide specific career-focused guidance based on the student's profile"
       : "- Note that no personalized career guidance was available for this assessment\n   - Provide general career recommendations based on performance patterns"
   }

5. NEXT STEPS & ACTION PLAN
   - Immediate focus areas
   - Long-term development goals
   - Suggested timeline for improvement
   ${hasPersonalizedContent ? "- Reference specific personalized action steps from individual questions" : ""}

Make the report professional, constructive, and actionable. Include specific examples from the student's responses where relevant. If personalized content is available, integrate it seamlessly into the overall analysis.

IMPORTANT: This report will be followed by a complete assessment backup section, so focus on analysis and recommendations rather than repeating all the detailed answers.`

    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: reportPrompt,
      temperature: 0.3,
      maxTokens: 4000,
    })

    const analysisReport = result.text.trim()

    // Combine the AI analysis with the complete assessment backup
    const fullReport = `${analysisReport}

${"=".repeat(100)}
${"=".repeat(100)}

COMPLETE ASSESSMENT BACKUP
This section contains your complete assessment responses and all AI feedback for your records.

Assessment Details:
- Student: ${studentData.name} ${studentData.surname}
- Student Number: ${studentData.studentNumber}
- Assessment: ${currentDocument?.title || "Business Assessment"}
- Date Completed: ${new Date().toLocaleDateString()}
- Overall Score: ${overallPercentage}% (${totalScore}/${totalPossible} points)

${completeAssessmentBackup}

${"=".repeat(100)}

END OF COMPLETE ASSESSMENT BACKUP

This report was generated on ${new Date().toLocaleString()} and contains both your performance analysis and complete assessment backup for your records.`

    console.log("✅ Student report with complete backup generated successfully")

    return NextResponse.json({
      success: true,
      report: fullReport,
      metadata: {
        totalScore,
        totalPossible,
        overallPercentage,
        cognitiveBreakdown,
        questionsCompleted: results.length,
        hasPersonalizedContent,
        generatedAt: new Date().toISOString(),
        includesCompleteBackup: true,
      },
      rawData: {
        questions,
        results,
        qaSection,
        personalizedSummary,
        completeAssessmentBackup,
      },
    })
  } catch (error) {
    console.error("❌ Error generating student report:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
