import { getAllAssessmentResults } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Debug: Fetching all assessment results...")
    const results = await getAllAssessmentResults()

    console.log("📊 Debug: Results found:", results.length)

    if (results.length > 0) {
      const sampleResult = results[0]
      console.log("🔍 Debug: Sample result structure:", {
        id: sampleResult.id,
        student: sampleResult.students?.name,
        resultsDataLength: sampleResult.results_data?.length,
        firstQuestion: sampleResult.results_data?.[0],
        questionsDataLength: sampleResult.questions_data?.length,
      })

      // Check each question in the first result
      sampleResult.results_data?.forEach((q: any, index: number) => {
        console.log(`🔍 Debug: Q${index + 1} structure:`, {
          questionId: q.questionId,
          hasAnswer: !!q.answer,
          hasScore: !!q.score,
          hasAiDetection: !!q.aiDetection,
          hasMetaAiDetection: !!q.meta?.aiDetection,
          hasAi_detection: !!q.ai_detection,
          allKeys: Object.keys(q),
          aiDetectionValue: q.aiDetection,
          metaValue: q.meta,
        })
      })
    }

    return Response.json({
      success: true,
      count: results.length,
      sampleResult:
        results.length > 0
          ? {
              id: results[0].id,
              student: results[0].students?.name,
              resultsData: results[0].results_data,
              questionsData: results[0].questions_data,
            }
          : null,
    })
  } catch (error) {
    console.error("❌ Debug error:", error)
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
