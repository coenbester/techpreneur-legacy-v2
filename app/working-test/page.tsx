"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Database, Globe, Settings } from "lucide-react"

interface ApiTestResult {
  success: boolean
  message?: string
  diagnostics?: any
  error?: string
}

export default function WorkingTestPage() {
  const [apiResult, setApiResult] = useState<ApiTestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/deployment-test")
      const data = await response.json()
      setApiResult(data)
    } catch (error) {
      setApiResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    testAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />🎉 WORKING TEST PAGE
            </CardTitle>
            <CardDescription className="text-green-700">
              This page confirms that Next.js routing and components are working correctly
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Routing Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Next.js routing works</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Components render</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">File system routing</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Testing API...</span>
                </div>
              ) : apiResult ? (
                <div className="space-y-2">
                  {apiResult.success ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">API working</span>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        {apiResult.diagnostics?.status || "Success"}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">API error</span>
                      </div>
                      <Badge variant="destructive">Error</Badge>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-500">Not tested</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apiResult?.diagnostics && (
                <div className="space-y-2">
                  <div className="text-xs">
                    <strong>Environment:</strong> {apiResult.diagnostics.environment}
                  </div>
                  <div className="text-xs">
                    <strong>Deployment:</strong> {apiResult.diagnostics.deployment}
                  </div>
                  <div className="text-xs">
                    <strong>Supabase:</strong> {apiResult.diagnostics.hasSupabaseUrl ? "✅" : "❌"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {apiResult && (
          <Card>
            <CardHeader>
              <CardTitle>API Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Navigation Test</CardTitle>
            <CardDescription>Test different routes to verify they work correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => (window.location.href = "/")} variant="outline">
                Main Page
              </Button>
              <Button onClick={() => (window.location.href = "/admin")} variant="outline">
                Admin Page
              </Button>
              <Button onClick={() => (window.location.href = "/debug")} variant="outline">
                Debug Page
              </Button>
              <Button onClick={() => (window.location.href = "/simple-debug")} variant="outline">
                Simple Debug
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>This working-test page is loading correctly</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Next.js routing is functional</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>React components are rendering</span>
              </div>
              <div className="text-xs text-gray-500 mt-4">Timestamp: {new Date().toISOString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
