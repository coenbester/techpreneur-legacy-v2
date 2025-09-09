"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import CognitiveGuidance from "@/components/cognitive-guidance"
import {
  getManualScoringSession,
  getAssessmentsForManualScoring,
  saveManualScore,
  getManualScoresForAssessment,
  updateScoringSessionStatus,
} from "@/lib/manual-scoring"

export default function ManualScoringPage() {
  const [sessionId, setSessionId] = useState("")
  const [scorerName, setScorerName] = useState("")
  const [session, setSession] = useState<any>(null)
  const [assessments, setAssessments] = useState<any[]>([])
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0)
  const [manualScores, setManualScores] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  const loadSession = async () => {
    if (!sessionId.trim() || !scorerName.trim()) {
      setAuthError("Please enter both Session ID and your name")
      return
    }

    setIsLoading(true)
    setAuthError("")

    try {
      const sessionData = await getManualScoringSession(sessionId)
      setSession(sessionData)

      const assessmentData = await getAssessmentsForManualScoring(sessionData.assessment_result_ids)
      setAssessments(assessmentData)

      // Load existing manual scores for first assessment
      if (assessmentData.length > 0) {
        const scores = await getManualScoresForAssessment(assessmentData[0].id)
        setManualScores(scores)
      }

      // Update session status to in_progress if it's pending
      if (sessionData.status === "pending") {
        await updateScoringSessionStatus(sessionId, "in_progress")
      }
    } catch (error: any) {
      setAuthError(error.message || "Failed to load scoring session")
    } finally {
      setIsLoading(false)
    }
  }

  const switchAssessment = async (index: number) => {
    setCurrentAssessmentIndex(index)
    const scores = await getManualScoresForAssessment(assessments[index].id)
    setManualScores(scores)
  }

  const saveScore = async (questionIndex: number, score: number, feedback: string) => {
    try {
      await saveManualScore(assessments[currentAssessmentIndex].id, questionIndex, score, feedback, scorerName)

      // Reload manual scores
      const scores = await getManualScoresForAssessment(assessments[currentAssessmentIndex].id)
      setManualScores(scores)

      // Show success feedback
      const button = document.getElementById(`save-btn-${questionIndex}`)
      if (button) {
        button.textContent = "✅ Saved!"
        setTimeout(() => {
          button.textContent = "Save Score"
        }, 2000)
      }
    } catch (error: any) {
      alert("Error saving score: " + error.message)
    }
  }

  const completeSession = async () => {
    try {
      await updateScoringSessionStatus(sessionId, "completed")
      alert("Scoring session completed! Thank you for your work.")
      setSession({ ...session, status: "completed" })
    } catch (error: any) {
      alert("Error completing session: " + error.message)
    }
  }

  const getMaxScore = (questionIndex: number, questionsData: any[]) => {
    if (questionIndex === 5) return 50 // Reflection question
    const questionData = questionsData?.[questionIndex]
    if (questionData?.cognitiveType === "Reflection") return 50
    return 10
  }

  const getExistingScore = (questionIndex: number) => {
    return manualScores.find((score) => score.question_index === questionIndex)
  }

  const getCognitiveType = (questionIndex: number) => {
    const questionData = assessments[currentAssessmentIndex].questions_data?.[questionIndex]
    return questionData?.cognitiveType || (questionIndex === 5 ? "Reflection" : "Understanding")
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">🎯 Manual Scoring System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Session ID</label>
              <Input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID provided by instructor"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Your Name</label>
              <Input
                type="text"
                value={scorerName}
                onChange={(e) => setScorerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <Button onClick={loadSession} disabled={isLoading} className="w-full">
              {isLoading ? "Loading..." : "Start Manual Scoring"}
            </Button>
            <p className="text-xs text-gray-500 text-center">Contact your instructor if you need a session ID.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (assessments.length === 0) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">No assessments found for this session</h1>
      </div>
    )
  }

  const currentAssessment = assessments[currentAssessmentIndex]
  const progress = Math.round(((currentAssessmentIndex + 1) / assessments.length) * 100)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">🎯 Manual Scoring</h1>
          <p className="text-gray-600">Session: {session.session_name}</p>
        </div>
        <div className="text-right">
          <Badge variant={session.status === "completed" ? "default" : "secondary"}>
            {session.status.toUpperCase()}
          </Badge>
          <p className="text-sm text-gray-600 mt-1">Scorer: {scorerName}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Assessment {currentAssessmentIndex + 1} of {assessments.length}
          </span>
          <span>{progress}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Assessment Navigation */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {assessments.map((_, index) => (
          <Button
            key={index}
            variant={index === currentAssessmentIndex ? "default" : "outline"}
            size="sm"
            onClick={() => switchAssessment(index)}
          >
            Student {index + 1}
          </Button>
        ))}
      </div>

      {/* Current Assessment */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            Student: {currentAssessment.students?.name} ({currentAssessment.students?.student_number})
          </CardTitle>
          <p className="text-sm text-gray-600">
            Lecture: {currentAssessment.lecture_title} | Submitted:{" "}
            {new Date(currentAssessment.completed_at).toLocaleDateString()}
          </p>
        </CardHeader>
      </Card>

      {/* Important Notice for Unbiased Scoring */}
      <Card className="mb-6 border-2 border-orange-500 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-orange-800 mb-2">UNBIASED SCORING NOTICE</h3>
              <p className="text-sm text-orange-700">
                <strong>Important:</strong> AI scores are hidden to ensure your manual scoring is completely unbiased.
                Please evaluate each answer independently based on your own judgment and the scoring guidelines
                provided.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions for Scoring */}
      <div className="space-y-6">
        {currentAssessment.results_data.map((questionResult: any, index: number) => {
          const maxScore = getMaxScore(index, currentAssessment.questions_data)
          const existingScore = getExistingScore(index)

          return (
            <Card key={index} className="border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {index + 1} (Worth {maxScore} points)
                </CardTitle>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-medium text-blue-800">{questionResult.question}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Student's Answer:</h4>
                  <div className="bg-gray-50 p-4 rounded border max-h-64 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{questionResult.answer || "No answer provided"}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Word count:{" "}
                    {
                      (questionResult.answer || "")
                        .trim()
                        .split(/\s+/)
                        .filter((w: string) => w.length > 0).length
                    }{" "}
                    words
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Your Manual Score:</h4>
                    <div className="flex gap-2 items-center mb-2">
                      <Input
                        type="number"
                        min="0"
                        max={maxScore}
                        defaultValue={existingScore?.manual_score || ""}
                        placeholder={`0-${maxScore}`}
                        className="w-20"
                        id={`score-${index}`}
                      />
                      <span>/ {maxScore}</span>
                    </div>
                    <Textarea
                      placeholder="Optional feedback for this answer..."
                      defaultValue={existingScore?.manual_feedback || ""}
                      className="mb-2"
                      id={`feedback-${index}`}
                    />
                    <Button
                      id={`save-btn-${index}`}
                      onClick={() => {
                        const scoreInput = document.getElementById(`score-${index}`) as HTMLInputElement
                        const feedbackInput = document.getElementById(`feedback-${index}`) as HTMLTextAreaElement
                        const score = Number.parseInt(scoreInput.value)

                        if (isNaN(score) || score < 0 || score > maxScore) {
                          alert(`Please enter a valid score between 0 and ${maxScore}`)
                          return
                        }

                        saveScore(index, score, feedbackInput.value)
                      }}
                      size="sm"
                    >
                      Save Score
                    </Button>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded">
                    <h4 className="font-semibold mb-2 text-yellow-800">
                      Scoring Guidelines for {getCognitiveType(index)}:
                    </h4>
                    <CognitiveGuidance cognitiveType={getCognitiveType(index)} isExpanded={true} />
                  </div>
                </div>

                {existingScore && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      ✅ Scored: {existingScore.manual_score}/{maxScore} on{" "}
                      {new Date(existingScore.scored_at).toLocaleString()}
                    </p>
                    {existingScore.manual_feedback && (
                      <p className="text-xs text-green-700 mt-1">Feedback: "{existingScore.manual_feedback}"</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Navigation and Completion */}
      <div className="mt-8 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => switchAssessment(Math.max(0, currentAssessmentIndex - 1))}
            disabled={currentAssessmentIndex === 0}
          >
            ← Previous Student
          </Button>
          <Button
            variant="outline"
            onClick={() => switchAssessment(Math.min(assessments.length - 1, currentAssessmentIndex + 1))}
            disabled={currentAssessmentIndex === assessments.length - 1}
          >
            Next Student →
          </Button>
        </div>

        {session.status !== "completed" && (
          <Button onClick={completeSession} variant="default">
            🎉 Complete Scoring Session
          </Button>
        )}
      </div>
    </div>
  )
}
