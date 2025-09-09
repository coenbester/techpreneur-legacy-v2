"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAllAssessmentResults } from "@/lib/supabase"
import { createManualScoringSession } from "@/lib/manual-scoring"

export default function ResultsPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [authError, setAuthError] = useState("")

  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Manual scoring session creation
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [sessionCreated, setSessionCreated] = useState<{ id: string; assignedTo: string } | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/auth/results/me", { cache: "no-store" })
        const data = await res.json()
        setAuthed(Boolean(data.authenticated))
      } catch {
        setAuthed(false)
      } finally {
        setAuthLoading(false)
      }
    }
    check()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    try {
      const res = await fetch("/api/auth/results/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: accessCode }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setAuthError(data.message || "Invalid access code")
        return
      }
      setAuthed(true)
      setAccessCode("")
    } catch (err: any) {
      setAuthError(err.message || "Login failed")
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/results/logout", { method: "POST" })
      setAuthed(false)
    } catch {}
  }

  useEffect(() => {
    if (!authed) return
    loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  const loadResults = async () => {
    setIsLoading(true)
    const data = await getAllAssessmentResults()
    setResults(data)
    setIsLoading(false)
  }

  // Helper function to determine max score for a question
  const getMaxScore = (questionIndex: number, questionsData: any[]) => {
    if (questionIndex === 5) return 50
    const questionData = questionsData?.[questionIndex]
    if (questionData?.cognitiveType === "Reflection") return 50
    return 10
  }

  // Smart sampling for manual scoring
  const selectSampleSubmissions = (lectureResults: any[]) => {
    if (lectureResults.length < 6) {
      return lectureResults
    }

    const sorted = [...lectureResults].sort((a, b) => a.average_score - b.average_score)
    const total = sorted.length
    const sample = []

    // Select 2 low, 2 medium, 2 high performers
    sample.push(sorted[0], sorted[Math.min(Math.floor(total * 0.33), total - 1)])
    const midStart = Math.floor(total * 0.33)
    const midEnd = Math.floor(total * 0.67)
    sample.push(sorted[midStart], sorted[Math.min(midEnd, total - 1)])
    sample.push(sorted[Math.max(Math.floor(total * 0.67), 0)], sorted[total - 1])

    return sample.filter((item, index, arr) => arr.findIndex((other) => other.id === item.id) === index).slice(0, 6)
  }

  const createScoringSession = async () => {
    if (!sessionName.trim() || !assignedTo.trim()) {
      alert("Please enter session name and assignee name")
      return
    }

    if (selectedResults.length === 0) {
      alert("Please select at least one submission for manual scoring")
      return
    }

    try {
      const session = await createManualScoringSession(sessionName, selectedResults, assignedTo)
      setSessionCreated({ id: session.id, assignedTo })
      setShowCreateSession(false)
      setSessionName("")
      setAssignedTo("")
      setSelectedResults([])
    } catch (error: any) {
      alert("Error creating session: " + error.message)
    }
  }

  const autoSelectSample = () => {
    // Group results by lecture and select samples
    const lectureGroups = results.reduce((groups: any, result) => {
      const lecture = result.lecture_title
      if (!groups[lecture]) groups[lecture] = []
      groups[lecture].push(result)
      return groups
    }, {})

    const sampleIds: string[] = []
    Object.values(lectureGroups).forEach((lectureResults: any) => {
      const samples = selectSampleSubmissions(lectureResults)
      sampleIds.push(...samples.map((s) => s.id))
    })

    setSelectedResults(sampleIds)
  }

  const exportToCSV = () => {
    const csvContent = [
      [
        "Student Name",
        "Student Number",
        "Email",
        "Lecture",
        "Total Score",
        "Average Score",
        "Completed Date",
        "AI Flagged",
        "Q1 AI",
        "Q2 AI",
        "Q3 AI",
        "Q4 AI",
        "Q5 AI",
        "Q6 AI",
      ],
      ...results.map((result) => {
        const aiFlagged = result.results_data.some((q: any) => {
          const hasAI = q.aiDetection?.flagged || q.meta?.aiDetection?.flagged || q.ai_detection?.flagged
          return hasAI
        })

        const getQuestionAI = (index: number) => {
          const question = result.results_data[index]
          if (!question) return "No Data"
          const detection = question.aiDetection || question.meta?.aiDetection || question.ai_detection
          if (detection?.flagged) {
            return `${detection.confidence}%`
          }
          return "No"
        }

        return [
          result.students?.name || "N/A",
          result.students?.student_number || "N/A",
          result.students?.email || "N/A",
          result.lecture_title,
          result.total_score,
          result.average_score.toFixed(1),
          new Date(result.completed_at).toLocaleDateString(),
          aiFlagged ? "YES" : "NO",
          getQuestionAI(0),
          getQuestionAI(1),
          getQuestionAI(2),
          getQuestionAI(3),
          getQuestionAI(4),
          getQuestionAI(5),
        ]
      }),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `assessment_results_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const copySessionId = () => {
    if (sessionCreated) {
      navigator.clipboard.writeText(sessionCreated.id)
      alert("Session ID copied to clipboard!")
    }
  }

  if (authLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <p>Checking access...</p>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Results Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Enter access code</label>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border rounded px-3 py-2"
                  required
                />
                {authError && <p className="text-sm text-red-600 mt-2">{authError}</p>}
              </div>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-3">Contact your instructor for the access code.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📊 Assessment Results</h1>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <p>Loading results...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📊 Assessment Results</h1>
        <div className="flex items-center gap-2">
          <Button onClick={exportToCSV} disabled={results.length === 0}>
            📥 Export to CSV
          </Button>
          <Button onClick={() => setShowCreateSession(true)} disabled={results.length === 0} variant="outline">
            🎯 Create Manual Scoring Session
          </Button>
          <Button onClick={() => window.open("/manual-comparison", "_blank")} variant="outline">
            📊 View Manual Comparisons
          </Button>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Manual Scoring Session Creation Modal */}
      {showCreateSession && (
        <Card className="mb-6 border-2 border-blue-500">
          <CardHeader>
            <CardTitle>🎯 Create Manual Scoring Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Session Name</label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Week 3 Manual Review"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Assigned To</label>
                <Input
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Assistant's name"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Select Submissions ({selectedResults.length} selected)</label>
                <Button onClick={autoSelectSample} size="sm" variant="outline">
                  Auto-Select Sample (2 High, 2 Mid, 2 Low per lecture)
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {results.map((result) => (
                  <label key={result.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedResults.includes(result.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedResults([...selectedResults, result.id])
                        } else {
                          setSelectedResults(selectedResults.filter((id) => id !== result.id))
                        }
                      }}
                    />
                    <span>
                      {result.students?.name} - {result.lecture_title} ({result.average_score.toFixed(1)}/10)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createScoringSession}>Create Session</Button>
              <Button onClick={() => setShowCreateSession(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Created Success Modal */}
      {sessionCreated && (
        <Card className="mb-6 border-2 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">✅ Manual Scoring Session Created!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded border">
              <p className="text-sm text-gray-600 mb-2">Session ID for {sessionCreated.assignedTo}:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-gray-100 rounded font-mono text-sm">{sessionCreated.id}</code>
                <Button onClick={copySessionId} size="sm">
                  📋 Copy
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Instructions for your assistant:</strong>
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>
                  Go to: <code className="bg-gray-100 px-1 rounded">{window.location.origin}/manual-scoring</code>
                </li>
                <li>Enter the Session ID above</li>
                <li>
                  Enter their name: <strong>{sessionCreated.assignedTo}</strong>
                </li>
                <li>Start manual scoring</li>
              </ol>
            </div>
            <Button onClick={() => setSessionCreated(null)} variant="outline">
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          <strong>Total Submissions:</strong> {results.length} | <strong>Average Score:</strong>{" "}
          {results.length > 0
            ? (() => {
                const properAverages = results.map((result) => {
                  const totalScore = result.total_score
                  const totalPossible = result.results_data.reduce((sum: number, q: any, index: number) => {
                    const maxScore = getMaxScore(index, result.questions_data)
                    return sum + maxScore
                  }, 0)
                  return (totalScore / totalPossible) * 10
                })
                return (properAverages.reduce((sum, avg) => sum + avg, 0) / properAverages.length).toFixed(1)
              })()
            : 0}
          /10
        </p>
      </div>

      <div className="space-y-4">
        {results.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No assessment results yet.</p>
            </CardContent>
          </Card>
        ) : (
          results.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{result.students?.name || "Unknown Student"}</span>
                  <span className="text-lg font-bold text-green-600">{result.average_score.toFixed(1)}/10</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Student Number:</strong>
                    <br />
                    {result.students?.student_number || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong>
                    <br />
                    {result.students?.email || "N/A"}
                  </div>
                  <div>
                    <strong>Lecture:</strong>
                    <br />
                    {result.lecture_title}
                  </div>
                  <div>
                    <strong>Completed:</strong>
                    <br />
                    {new Date(result.completed_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <strong>Questions & Full Answers:</strong>
                  <div className="mt-2 space-y-6">
                    {result.results_data.map((q: any, index: number) => {
                      const maxScore = getMaxScore(index, result.questions_data)
                      const aiDetection = q.aiDetection || q.meta?.aiDetection || q.ai_detection
                      return (
                        <div key={index} className="border-l-4 border-blue-200 pl-4 bg-white p-4 rounded">
                          <div className="mb-3">
                            <p className="font-bold text-blue-800 text-lg mb-2">Question {index + 1}:</p>
                            <p className="text-gray-700 bg-blue-50 p-3 rounded border italic">{q.question}</p>
                          </div>

                          <div className="mb-3">
                            <p className="font-semibold text-gray-800 mb-2">Student's Full Answer:</p>
                            <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
                              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {q.answer || "No answer provided"}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Word count:{" "}
                              {
                                (q.answer || "")
                                  .trim()
                                  .split(/\s+/)
                                  .filter((w) => w.length > 0).length
                              }{" "}
                              words
                            </p>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t">
                            <p className="text-blue-600 font-bold text-lg">
                              Score: {q.score}/{maxScore} points
                            </p>
                            {aiDetection?.flagged && (
                              <p className="text-red-600 font-bold bg-red-100 px-3 py-1 rounded">
                                🚨 AI DETECTED: {aiDetection.confidence}%
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {result.results_data.some(
                  (q: any) => q.aiDetection?.flagged || q.meta?.aiDetection?.flagged || q.ai_detection?.flagged,
                ) && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-600 font-bold">🚨 AI DETECTION ALERT</span>
                    </div>
                    <div className="text-sm space-y-1">
                      {result.results_data.map((q: any, index: number) => {
                        const detection = q.aiDetection || q.meta?.aiDetection || q.ai_detection
                        return detection?.flagged ? (
                          <div key={index} className="text-red-700">
                            <strong>Q{index + 1}:</strong> {detection.confidence}% confidence
                            <br />
                            <span className="text-xs">Patterns: {detection.reasons?.join(", ")}</span>
                          </div>
                        ) : null
                      })}
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ This submission requires manual review for academic integrity.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
