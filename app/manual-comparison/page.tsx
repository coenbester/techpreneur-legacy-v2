"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  getAllManualScoringSessions,
  getAssessmentsForManualScoring,
  getManualScoresForAssessment,
} from "@/lib/manual-scoring"

export default function ManualComparisonPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [authError, setAuthError] = useState("")

  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [assessments, setAssessments] = useState<any[]>([])
  const [comparisonData, setComparisonData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    loadSessions()
  }, [authed])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const sessionsData = await getAllManualScoringSessions()
      setSessions(sessionsData)
    } catch (error) {
      console.error("Error loading sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSessionComparison = async (session: any) => {
    setSelectedSession(session)
    setIsLoading(true)

    try {
      // Get assessments for this session
      const assessmentsData = await getAssessmentsForManualScoring(session.assessment_result_ids)
      setAssessments(assessmentsData)

      // Get manual scores for each assessment
      const comparisonResults = []
      for (const assessment of assessmentsData) {
        const manualScores = await getManualScoresForAssessment(assessment.id)
        comparisonResults.push({
          assessment,
          manualScores,
        })
      }
      setComparisonData(comparisonResults)
    } catch (error) {
      console.error("Error loading session comparison:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMaxScore = (questionIndex: number, questionsData: any[]) => {
    if (questionIndex === 5) return 50
    const questionData = questionsData?.[questionIndex]
    if (questionData?.cognitiveType === "Reflection") return 50
    return 10
  }

  const calculateTotalScores = (assessment: any, manualScores: any[]) => {
    let aiTotal = 0
    let manualTotal = 0
    let maxTotal = 0

    assessment.results_data.forEach((q: any, index: number) => {
      const maxScore = getMaxScore(index, assessment.questions_data)
      const manualScore = manualScores.find((ms) => ms.question_index === index)

      aiTotal += q.score
      manualTotal += manualScore?.manual_score || 0
      maxTotal += maxScore
    })

    return {
      aiTotal,
      manualTotal,
      maxTotal,
      aiAverage: (aiTotal / maxTotal) * 10,
      manualAverage: (manualTotal / maxTotal) * 10,
    }
  }

  const exportComparisonCSV = () => {
    if (!selectedSession || comparisonData.length === 0) return

    // Create comprehensive CSV with summary and detailed data
    const csvContent = [
      // Header with session info
      [`Manual vs AI Scoring Comparison Report`],
      [`Session: ${selectedSession.session_name}`],
      [`Assigned To: ${selectedSession.assigned_to}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Status: ${selectedSession.status.toUpperCase()}`],
      [``], // Empty row

      // Summary statistics
      [`SUMMARY STATISTICS`],
      [`Total Students: ${comparisonData.length}`],
      [`Completed Manual Scores: ${comparisonData.filter(({ manualScores }) => manualScores.length > 0).length}`],
      [``], // Empty row

      // Detailed comparison data header
      [
        "Student Name",
        "Student Number",
        "Email",
        "Lecture",
        "Question",
        "Question Text",
        "Max Score",
        "AI Score",
        "Manual Score",
        "Difference (Manual - AI)",
        "Percentage Difference",
        "Manual Feedback",
        "Scorer Name",
        "Scored Date",
        "Student Answer (First 200 chars)",
      ],

      // Data rows
      ...comparisonData.flatMap(({ assessment, manualScores }) =>
        assessment.results_data.map((q: any, index: number) => {
          const maxScore = getMaxScore(index, assessment.questions_data)
          const manualScore = manualScores.find((ms) => ms.question_index === index)
          const aiScore = q.score
          const manual = manualScore?.manual_score || 0
          const difference = manual - aiScore
          const percentageDiff = aiScore > 0 ? ((difference / aiScore) * 100).toFixed(1) : "N/A"

          return [
            assessment.students?.name || "N/A",
            assessment.students?.student_number || "N/A",
            assessment.students?.email || "N/A",
            assessment.lecture_title,
            `Q${index + 1}`,
            `"${(q.question || "").replace(/"/g, '""')}"`, // Escape quotes in question text
            maxScore,
            aiScore,
            manualScore ? manual : "Not Scored",
            manualScore ? difference : "N/A",
            manualScore ? `${percentageDiff}%` : "N/A",
            `"${(manualScore?.manual_feedback || "").replace(/"/g, '""')}"`, // Escape quotes
            manualScore?.scorer_name || "Not scored",
            manualScore ? new Date(manualScore.scored_at).toLocaleDateString() : "N/A",
            `"${((q.answer || "No answer").substring(0, 200) + (q.answer?.length > 200 ? "..." : "")).replace(/"/g, '""')}"`, // Truncated answer
          ]
        }),
      ),

      [``], // Empty row
      [`END OF REPORT`],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Manual_vs_AI_Comparison_${selectedSession.session_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportSummaryCSV = () => {
    if (!selectedSession || comparisonData.length === 0) return

    const csvContent = [
      // Header
      [
        "Student Name",
        "Student Number",
        "Email",
        "Lecture",
        "AI Total Score",
        "AI Average (/10)",
        "Manual Total Score",
        "Manual Average (/10)",
        "Total Difference",
        "Average Difference",
        "Questions Manually Scored",
        "Completion Status",
      ],

      // Summary data for each student
      ...comparisonData.map(({ assessment, manualScores }) => {
        const scores = calculateTotalScores(assessment, manualScores)
        const hasManualScores = manualScores.length > 0
        const questionsScored = manualScores.length
        const totalQuestions = assessment.results_data.length

        return [
          assessment.students?.name || "N/A",
          assessment.students?.student_number || "N/A",
          assessment.students?.email || "N/A",
          assessment.lecture_title,
          scores.aiTotal,
          scores.aiAverage.toFixed(1),
          hasManualScores ? scores.manualTotal : "Not Scored",
          hasManualScores ? scores.manualAverage.toFixed(1) : "Not Scored",
          hasManualScores ? scores.manualTotal - scores.aiTotal : "N/A",
          hasManualScores ? (scores.manualAverage - scores.aiAverage).toFixed(1) : "N/A",
          `${questionsScored}/${totalQuestions}`,
          questionsScored === totalQuestions ? "Complete" : questionsScored > 0 ? "Partial" : "Not Started",
        ]
      }),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Manual_Scoring_Summary_${selectedSession.session_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
            <CardTitle>Manual Scoring Comparison Access</CardTitle>
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
          <h1 className="text-3xl font-bold">📊 Manual vs AI Scoring Comparison</h1>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!selectedSession) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📊 Manual vs AI Scoring Comparison</h1>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Select a Manual Scoring Session</h2>
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No manual scoring sessions found.</p>
                <p className="text-sm text-gray-500 mt-2">Create a session in the Results page first.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:shadow-md"
                  onClick={() => loadSessionComparison(session)}
                >
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{session.session_name}</span>
                      <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                        {session.status.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>Assigned To:</strong>
                        <br />
                        {session.assigned_to}
                      </div>
                      <div>
                        <strong>Submissions:</strong>
                        <br />
                        {session.assessment_result_ids.length}
                      </div>
                      <div>
                        <strong>Created:</strong>
                        <br />
                        {new Date(session.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Completed:</strong>
                        <br />
                        {session.completed_at ? new Date(session.completed_at).toLocaleDateString() : "In Progress"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">📊 Manual vs AI Scoring Comparison</h1>
          <p className="text-gray-600">Session: {selectedSession.session_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button onClick={exportComparisonCSV} disabled={comparisonData.length === 0} size="sm">
              📥 Export Detailed CSV
            </Button>
            <Button onClick={exportSummaryCSV} disabled={comparisonData.length === 0} size="sm" variant="outline">
              📊 Export Summary CSV
            </Button>
          </div>
          <Button onClick={() => setSelectedSession(null)} variant="outline">
            ← Back to Sessions
          </Button>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Session Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Assigned To:</strong>
              <br />
              {selectedSession.assigned_to}
            </div>
            <div>
              <strong>Status:</strong>
              <br />
              <Badge variant={selectedSession.status === "completed" ? "default" : "secondary"}>
                {selectedSession.status.toUpperCase()}
              </Badge>
            </div>
            <div>
              <strong>Submissions:</strong>
              <br />
              {comparisonData.length}
            </div>
            <div>
              <strong>Completed:</strong>
              <br />
              {selectedSession.completed_at
                ? new Date(selectedSession.completed_at).toLocaleDateString()
                : "In Progress"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      <div className="space-y-6">
        {comparisonData.map(({ assessment, manualScores }, index) => {
          const scores = calculateTotalScores(assessment, manualScores)
          const hasManualScores = manualScores.length > 0

          return (
            <Card key={assessment.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>
                    {assessment.students?.name} ({assessment.students?.student_number})
                  </span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600">AI: {scores.aiAverage.toFixed(1)}/10</span>
                    <span className="text-green-600">
                      Manual: {hasManualScores ? scores.manualAverage.toFixed(1) : "Not scored"}/10
                    </span>
                    {hasManualScores && (
                      <span
                        className={`font-bold ${scores.manualAverage - scores.aiAverage >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        Diff: {(scores.manualAverage - scores.aiAverage).toFixed(1)}
                      </span>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-gray-600">
                  <strong>Lecture:</strong> {assessment.lecture_title} | <strong>Submitted:</strong>{" "}
                  {new Date(assessment.completed_at).toLocaleDateString()}
                </div>

                {!hasManualScores && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800">⚠️ This assessment has not been manually scored yet.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {assessment.results_data.map((q: any, qIndex: number) => {
                    const maxScore = getMaxScore(qIndex, assessment.questions_data)
                    const manualScore = manualScores.find((ms) => ms.question_index === qIndex)
                    const aiScore = q.score
                    const manual = manualScore?.manual_score || 0
                    const difference = manual - aiScore

                    return (
                      <div key={qIndex} className="border rounded p-4">
                        <div className="mb-2">
                          <h4 className="font-semibold">
                            Question {qIndex + 1} (Worth {maxScore} points)
                          </h4>
                          <p className="text-sm text-gray-600 italic">{q.question}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded">
                            <h5 className="font-semibold text-blue-800">AI Score</h5>
                            <p className="text-2xl font-bold text-blue-600">
                              {aiScore}/{maxScore}
                            </p>
                          </div>

                          <div className="bg-green-50 p-3 rounded">
                            <h5 className="font-semibold text-green-800">Manual Score</h5>
                            <p className="text-2xl font-bold text-green-600">
                              {manualScore ? `${manual}/${maxScore}` : "Not scored"}
                            </p>
                            {manualScore && (
                              <p className="text-xs text-gray-600 mt-1">
                                By: {manualScore.scorer_name} on {new Date(manualScore.scored_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div
                            className={`p-3 rounded ${difference > 0 ? "bg-green-50" : difference < 0 ? "bg-red-50" : "bg-gray-50"}`}
                          >
                            <h5 className="font-semibold text-gray-800">Difference</h5>
                            <p
                              className={`text-2xl font-bold ${difference > 0 ? "text-green-600" : difference < 0 ? "text-red-600" : "text-gray-600"}`}
                            >
                              {manualScore ? (difference >= 0 ? `+${difference}` : difference) : "N/A"}
                            </p>
                          </div>
                        </div>

                        {manualScore?.manual_feedback && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <h5 className="font-semibold text-gray-800 mb-1">Manual Feedback:</h5>
                            <p className="text-sm text-gray-700">{manualScore.manual_feedback}</p>
                          </div>
                        )}

                        <div className="mt-3 p-3 bg-gray-100 rounded max-h-32 overflow-y-auto">
                          <h5 className="font-semibold text-gray-800 mb-1">Student Answer:</h5>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {q.answer || "No answer provided"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
