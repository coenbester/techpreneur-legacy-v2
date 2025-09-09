"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestPage() {
  const [envTest, setEnvTest] = useState<string>("Testing...")
  const [apiTest, setApiTest] = useState<string>("Testing...")
  const [timestamp, setTimestamp] = useState<string>("")

  useEffect(() => {
    setTimestamp(new Date().toISOString())

    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("Environment check:", { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })

    if (supabaseUrl && supabaseKey) {
      setEnvTest(`✅ Environment variables found - URL: ${supabaseUrl.substring(0, 30)}...`)
    } else {
      setEnvTest(
        `❌ Environment variables missing - URL: ${supabaseUrl || "undefined"}, Key: ${supabaseKey ? "exists" : "undefined"}`,
      )
    }

    // Test API endpoint
    testAPI()
  }, [])

  const testAPI = async () => {
    try {
      console.log("Testing API endpoint...")
      const response = await fetch("/api/test-ai-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("API Response status:", response.status)
      const result = await response.json()
      console.log("API Result:", result)

      if (result.success) {
        setApiTest("✅ API endpoints working - AI connection successful")
      } else {
        setApiTest(`❌ API endpoints failing: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("API Test error:", error)
      setApiTest(`❌ API endpoints error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Deployment Diagnostic</CardTitle>
            <p className="text-sm text-gray-600">Generated at: {timestamp}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-2">Environment Variables</h3>
              <p className="text-sm font-mono">{envTest}</p>
            </div>

            <div className="p-4 border rounded-lg bg-green-50">
              <h3 className="font-semibold mb-2">API Endpoints</h3>
              <p className="text-sm font-mono">{apiTest}</p>
            </div>

            <div className="p-4 border rounded-lg bg-yellow-50">
              <h3 className="font-semibold mb-2">File Deployment</h3>
              <p className="text-sm">✅ This test page loaded successfully</p>
              <p className="text-sm">✅ React components are working</p>
              <p className="text-sm">✅ Tailwind CSS is loading</p>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => (window.location.href = "/")} className="flex-1">
                Go to Main Page
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                Refresh Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
