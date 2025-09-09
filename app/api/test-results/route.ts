import { type NextRequest, NextResponse } from "next/server"
import { saveAssessmentResult } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { studentId, lectureTitle, documentName, questionsData, resultsData, totalScore, averageScore } =
      await request.json()

    console.log("💾 Saving assessment result for student:", studentId)

    const result = await saveAssessmentResult(
      studentId,
      lectureTitle,
      documentName,
      questionsData,
      resultsData,
      totalScore,
      averageScore,
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("❌ Error saving test results:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
