import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const { studentId } = params

    console.log("🔍 PROFILE CHECK: Checking profile for student:", studentId)

    const { data, error } = await supabase.from("student_profiles").select("*").eq("student_id", studentId).single()

    if (error && error.code !== "PGRST116") {
      console.error("❌ PROFILE CHECK: Database error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (error && error.code === "PGRST116") {
      console.log("📭 PROFILE CHECK: No profile found for student:", studentId)
      return NextResponse.json({ success: true, hasProfile: false, profile: null })
    }

    console.log("✅ PROFILE CHECK: Profile found for student:", studentId)
    console.log("✅ PROFILE CHECK: Profile data:", data)
    return NextResponse.json({ success: true, hasProfile: true, profile: data })
  } catch (error) {
    console.error("❌ PROFILE CHECK: Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
