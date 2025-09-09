import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET() {
  try {
    console.log("📄 Fetching current document...")

    const { data: documents, error } = await supabase.from("documents").select("*").eq("is_current", true).single()

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json({
        success: false,
        error: "Database error: " + error.message,
      })
    }

    if (!documents) {
      console.log("⚠️ No current document found")
      return NextResponse.json({
        success: false,
        error: "No current document set",
      })
    }

    console.log("✅ Current document found:", documents.title)

    return NextResponse.json({
      success: true,
      document: documents,
    })
  } catch (error) {
    console.error("❌ Error fetching current document:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
