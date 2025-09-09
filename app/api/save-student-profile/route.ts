import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { studentId, profileData } = await request.json()

    console.log("💾 PROFILE SAVE: Saving profile for student:", studentId)
    console.log("💾 PROFILE SAVE: Profile data:", profileData)

    if (!studentId || !profileData) {
      console.error("❌ PROFILE SAVE: Missing studentId or profileData")
      return NextResponse.json({ success: false, error: "Missing required data" }, { status: 400 })
    }

    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from("student_profiles")
      .upsert(
        {
          student_id: studentId,
          qualification_level: profileData.qualificationLevel,
          qualification_discipline: profileData.qualificationDiscipline,
          work_experience_years: profileData.workExperienceYears,
          current_role: profileData.currentRole,
          industry: profileData.industry,
          startup_exposure: profileData.startupExposure,
          current_responsibilities: profileData.currentResponsibilities,
          career_goal: profileData.careerGoal,
          biggest_challenge: profileData.biggestChallenge,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "student_id",
        },
      )
      .select()

    if (error) {
      console.error("❌ PROFILE SAVE: Database error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("✅ PROFILE SAVE: Profile saved successfully:", data)
    return NextResponse.json({ success: true, profile: data[0] })
  } catch (error) {
    console.error("❌ PROFILE SAVE: Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
