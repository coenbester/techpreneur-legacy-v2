import { createClient } from "@supabase/supabase-js"

// Read from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Create a manual scoring session
export async function createManualScoringSession(
  sessionName: string,
  assessmentResultIds: string[],
  assignedTo: string,
) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized - missing environment variables")
    }

    console.log("Creating manual scoring session:", { sessionName, assessmentResultIds, assignedTo })

    const { data, error } = await supabase
      .from("manual_scoring_sessions")
      .insert([
        {
          session_name: sessionName,
          assessment_result_ids: assessmentResultIds,
          assigned_to: assignedTo,
          status: "pending",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating manual scoring session:", error)
      throw error
    }

    console.log("Manual scoring session created successfully:", data)
    return data
  } catch (err: any) {
    console.error("createManualScoringSession error:", err)
    throw err
  }
}

// Get a manual scoring session by ID
export async function getManualScoringSession(sessionId: string) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase.from("manual_scoring_sessions").select("*").eq("id", sessionId).single()

    if (error) {
      console.error("Error fetching manual scoring session:", error)
      throw error
    }

    return data
  } catch (err: any) {
    console.error("getManualScoringSession error:", err)
    throw err
  }
}

// Get assessments for manual scoring
export async function getAssessmentsForManualScoring(assessmentIds: string[]) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase
      .from("assessment_results")
      .select(`
        *,
        students (
          name,
          student_number,
          email
        )
      `)
      .in("id", assessmentIds)

    if (error) {
      console.error("Error fetching assessments for manual scoring:", error)
      throw error
    }

    return data || []
  } catch (err: any) {
    console.error("getAssessmentsForManualScoring error:", err)
    throw err
  }
}

// Save a manual score for a specific question
export async function saveManualScore(
  assessmentResultId: string,
  questionIndex: number,
  manualScore: number,
  manualFeedback: string,
  scorerName: string,
) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    // Check if a manual score already exists for this question
    const { data: existingScore } = await supabase
      .from("manual_scores")
      .select("id")
      .eq("assessment_result_id", assessmentResultId)
      .eq("question_index", questionIndex)
      .single()

    if (existingScore) {
      // Update existing score
      const { data, error } = await supabase
        .from("manual_scores")
        .update({
          manual_score: manualScore,
          manual_feedback: manualFeedback,
          scorer_name: scorerName,
          scored_at: new Date().toISOString(),
        })
        .eq("id", existingScore.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new score
      const { data, error } = await supabase
        .from("manual_scores")
        .insert([
          {
            assessment_result_id: assessmentResultId,
            question_index: questionIndex,
            manual_score: manualScore,
            manual_feedback: manualFeedback,
            scorer_name: scorerName,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (err: any) {
    console.error("saveManualScore error:", err)
    throw err
  }
}

// Get manual scores for a specific assessment
export async function getManualScoresForAssessment(assessmentResultId: string) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase
      .from("manual_scores")
      .select("*")
      .eq("assessment_result_id", assessmentResultId)
      .order("question_index", { ascending: true })

    if (error) {
      console.error("Error fetching manual scores:", error)
      throw error
    }

    return data || []
  } catch (err: any) {
    console.error("getManualScoresForAssessment error:", err)
    throw err
  }
}

// Update scoring session status
export async function updateScoringSessionStatus(sessionId: string, status: string) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const updateData: any = { status }
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("manual_scoring_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err: any) {
    console.error("updateScoringSessionStatus error:", err)
    throw err
  }
}

// Get all manual scoring sessions
export async function getAllManualScoringSessions() {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase
      .from("manual_scoring_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching manual scoring sessions:", error)
      throw error
    }

    return data || []
  } catch (err: any) {
    console.error("getAllManualScoringSessions error:", err)
    throw err
  }
}
