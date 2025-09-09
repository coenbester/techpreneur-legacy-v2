"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import CognitiveGuidance from "@/components/cognitive-guidance"
import StudentReport from "@/components/student-report"
import StudentProfileModal from "@/components/student-profile-modal"
import { User, CheckCircle, AlertCircle, Brain, BookOpen, FileText, Star, Construction, Settings } from "lucide-react"
import { createStudent } from "@/lib/supabase"

interface Question {
  id: number
  question: string
  cognitiveType: string
  cognitiveDescription: string
  keyPoints: string[]
  points: number
}

interface StudentData {
  id: string
  name: string
  surname: string
  studentNumber: string
  email: string
}

interface AssessmentResult {
  questionId: number
  question: string
  answer: string
  score: number
  feedback: string
  strengths: string
  improvements: string
  personalizedAdvice?: string
  nextSteps?: string
  personalized?: boolean
  profileUsed?: boolean
  cognitiveType: string
}

export default function DocumentChatApp() {
  // Student verification states
  const [isVerified, setIsVerified] = useState(false)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileStatus, setProfileStatus] = useState<string>("")
  const [verificationForm, setVerificationForm] = useState({
    name: "",
    surname: "",
    studentNumber: "",
    email: "",
  })

  // Assessment states
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<any>(null)

  // Report states
  const [showReport, setShowReport] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Loading states
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // AI connection test
  const [aiConnectionStatus, setAiConnectionStatus] = useState<"testing" | "connected" | "error">("testing")
  const [aiTestMessage, setAiTestMessage] = useState("Testing AI connection...")

  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [useBypassModal, setUseBypassModal] = useState(true) // Development toggle

  useEffect(() => {
    testAIConnection()
    loadCurrentDocument()
  }, [])

  const getCognitiveBadgeStyle = (cognitiveType: string) => {
    switch (cognitiveType) {
      case "Remember":
        return "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
      case "Understand":
        return "bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
      case "Apply":
        return "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
      case "Analyze":
        return "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100"
      case "Evaluate":
        return "bg-red-50 border-red-200 text-red-800 hover:bg-red-100"
      case "Reflection":
        return "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"
    }
  }

  const testAIConnection = async () => {
    try {
      setAiConnectionStatus("testing")
      setAiTestMessage("Testing AI connection...")

      const response = await fetch("/api/test-ai-connection", { method: "POST" })
      const result = await response.json()

      console.log("🔍 AI connection test result:", result)

      if (result.success) {
        setAiConnectionStatus("connected")
        setAiTestMessage("AI system ready")
      } else {
        setAiConnectionStatus("error")
        setAiTestMessage(`AI system error: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("AI connection test failed:", error)
      setAiConnectionStatus("error")
      setAiTestMessage("AI connection failed - check network or API key")
    }
  }

  const loadCurrentDocument = async () => {
    try {
      const response = await fetch("/api/documents/current")
      const result = await response.json()

      if (result.success && result.document) {
        setCurrentDocument(result.document)
      }
    } catch (error) {
      console.error("Failed to load current document:", error)
    }
  }

  const checkApprovedStudents = async (studentNumber: string) => {
    try {
      console.log("🔍 Checking student number:", studentNumber)
      const response = await fetch("/approved-students.csv")

      if (!response.ok) {
        console.error("Failed to fetch approved students CSV")
        return false
      }

      const csvText = await response.text()
      console.log("📄 CSV content preview:", csvText.substring(0, 200))

      const lines = csvText.split("\n")

      // Skip header row and check each line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line) {
          // Split by tab since the CSV is tab-separated
          const columns = line.split("\t")

          // The ID number is in the 3rd column (index 2)
          if (columns.length >= 3) {
            const csvStudentNumber = columns[2]?.trim().replace(/"/g, "")
            const cleanInputNumber = studentNumber.trim()

            console.log(`Comparing: "${csvStudentNumber}" vs "${cleanInputNumber}"`)

            if (csvStudentNumber === cleanInputNumber) {
              console.log("✅ Student number match found!")
              return true
            }
          }
        }
      }

      console.log("❌ No match found for student number:", studentNumber)
      return false
    } catch (error) {
      console.error("Error checking approved students:", error)
      return false
    }
  }

  const handleStudentVerification = async () => {
    const { name, surname, studentNumber, email } = verificationForm

    if (!name || !surname || !studentNumber || !email) {
      alert("Please fill in all fields")
      return
    }

    try {
      console.log("🔍 Verifying student:", studentNumber)
      setProfileStatus("Checking student number...")

      // Check if student number is in approved list
      const isApproved = await checkApprovedStudents(studentNumber)
      if (!isApproved) {
        alert("Student number not found in approved list. Please contact your instructor.")
        setProfileStatus("")
        return
      }

      console.log("✅ Student approved, creating/finding record...")
      setProfileStatus("Creating student record...")

      // Create or find student record
      const student = await createStudent(name + " " + surname, studentNumber, email)

      console.log("👤 Student record:", student)

      setStudentData({
        id: student.id,
        name,
        surname,
        studentNumber,
        email,
      })

      // Check if student has a profile for personalized feedback
      try {
        console.log("🔍 Checking for existing profile for student:", student.id)
        const profileResponse = await fetch(`/api/student-profile/${student.id}`)
        const profileResult = await profileResponse.json()

        console.log("📋 Profile check result:", profileResult)

        if (profileResult.success && profileResult.hasProfile) {
          setHasProfile(true)
          setProfileStatus("✅ Ready for assessment with personalized feedback!")
          console.log("🎯 Student has profile - personalized feedback enabled")
        } else {
          setHasProfile(false)
          setProfileStatus("✅ Ready for assessment!")
          console.log("📝 No profile found - standard feedback will be provided")
        }
      } catch (profileError) {
        console.error("❌ Error checking profile:", profileError)
        setHasProfile(false)
        setProfileStatus("✅ Ready for assessment!")
      }

      setIsVerified(true)
      console.log("🎉 Student verification complete!")

      // Show profile modal after successful verification
      setShowProfileModal(true)
    } catch (error) {
      console.error("❌ Student verification failed:", error)
      alert("Verification failed. Please try again.")
      setProfileStatus("")
    }
  }

  const handleProfileComplete = () => {
    console.log("✅ Profile completed - proceeding to assessment")
    setShowProfileModal(false)
    setHasProfile(true) // Enable personalized feedback
    setProfileStatus("✅ Profile saved! Personalized feedback enabled.")
  }

  const handleSkipProfile = () => {
    console.log("🚧 Profile skipped - proceeding to assessment")
    setShowProfileModal(false)
    setHasProfile(false) // No personalized feedback for now
  }

  const generateQuestions = async () => {
    if (!currentDocument) {
      alert("No document available for assessment")
      return
    }

    setIsLoadingQuestions(true)
    try {
      console.log("🎯 Starting question generation...")

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileContent: currentDocument.content,
        }),
      })

      const result = await response.json()
      console.log("📝 Question generation response:", result)

      if (result.success && result.questions) {
        console.log("✅ Questions generated successfully:", result.questions.length)
        console.log("🎲 Session ID:", result.metadata?.sessionId)
        console.log("🔄 Generation Seed:", result.metadata?.generationSeed)
        setQuestions(result.questions)
        setAnswers({})
        setResults([])
        setIsComplete(false)
        setShowReport(false)
        setReportData(null)
      } else {
        console.error("❌ Question generation failed:", result.error)
        console.error("❌ Full error details:", result)
        alert("Failed to generate questions: " + (result.error || "Unknown error"))
      }
    } catch (error) {
      console.error("❌ Question generation error:", error)
      alert("Failed to generate questions. Please try again.")
    }
    setIsLoadingQuestions(false)
  }

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const generateStudentReport = async () => {
    if (!studentData || !questions || !results) {
      console.error("Missing data for report generation")
      alert("Missing data for report generation")
      return
    }

    setIsGeneratingReport(true)
    try {
      console.log("📊 Generating student report...")

      const response = await fetch("/api/generate-student-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentData,
          questions,
          results,
          currentDocument,
        }),
      })

      const result = await response.json()
      console.log("📊 Report generation result:", result)

      if (result.success) {
        setReportData(result)
        setShowReport(true)
        console.log("✅ Student report generated successfully")
      } else {
        console.error("❌ Report generation failed:", result.error)
        alert("Failed to generate student report: " + result.error)
      }
    } catch (error) {
      console.error("❌ Report generation error:", error)
      alert("Failed to generate student report. Please try again.")
    }
    setIsGeneratingReport(false)
  }

  const downloadReport = () => {
    if (!reportData || !studentData) return

    const reportContent = `
STUDENT PERFORMANCE REPORT
==========================

Student: ${studentData.name} ${studentData.surname}
Student Number: ${studentData.studentNumber}
Assessment: ${currentDocument?.title || "Business Assessment"}
Date: ${new Date().toLocaleDateString()}

PERFORMANCE SUMMARY
==================
Overall Score: ${reportData.metadata?.overallPercentage || "0.0"}%
Points Earned: ${reportData.metadata?.totalScore || 0}/${reportData.metadata?.totalPossible || 0}

${reportData.report || "Report content not available"}

Generated by TechPreneur Assessment System
    `

    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${studentData.name}_${studentData.surname}_Assessment_Report.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const submitAllAnswers = async () => {
    // Validate all answers
    const unansweredQuestions = questions.filter((q) => !answers[q.id]?.trim())
    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions. Missing: ${unansweredQuestions.map((q) => q.id).join(", ")}`)
      return
    }

    setIsSubmitting(true)
    const newResults: AssessmentResult[] = []

    try {
      for (const question of questions) {
        const answer = answers[question.id]

        console.log(`🎯 Grading Q${question.id} (${question.cognitiveType})`)

        const response = await fetch("/api/grade-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.question,
            studentAnswer: answer,
            keyPoints: question.keyPoints,
            fileContent: currentDocument.content,
            cognitiveType: question.cognitiveType,
            studentId: studentData?.id, // Pass student ID for personalization
          }),
        })

        const data = await response.json()
        console.log(`📊 Grading result for Q${question.id}:`, data)

        if (data.success && data.grading) {
          try {
            const gradingData = JSON.parse(data.grading)

            const assessmentResult: AssessmentResult = {
              questionId: question.id,
              question: question.question,
              answer: answer,
              score: gradingData.score,
              feedback: gradingData.feedback,
              strengths: gradingData.strengths,
              improvements: gradingData.improvements,
              personalizedAdvice: gradingData.personalizedAdvice || "",
              nextSteps: gradingData.nextSteps || "",
              cognitiveType: question.cognitiveType,
              personalized: gradingData.personalized || false,
              profileUsed: gradingData.profileUsed || false,
            }

            newResults.push(assessmentResult)

            // Log personalization status
            if (gradingData.personalized && question.cognitiveType === "Reflection") {
              console.log(`🎯 Q${question.id}: Personalized feedback provided based on student profile`)
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse grading for Q${question.id}:`, parseError)
            alert(`Failed to parse grading result for Question ${question.id}. Please try again.`)
            setIsSubmitting(false)
            return
          }
        } else {
          console.error(`❌ Grading failed for Q${question.id}:`, data.error)
          alert(`Failed to grade Question ${question.id}: ${data.error}. Please try again.`)
          setIsSubmitting(false)
          return
        }
      }

      setResults(newResults)
      setIsComplete(true)

      // Save to database
      try {
        const totalScore = newResults.reduce((sum, r) => sum + r.score, 0)
        const totalPossible = questions.reduce((sum, q) => sum + (q.cognitiveType === "Reflection" ? 50 : 10), 0)
        const averageScore = (totalScore / totalPossible) * 10

        const response = await fetch("/api/test-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: studentData?.id,
            lectureTitle: currentDocument?.title || "Unknown Document",
            documentName: currentDocument?.title || "Unknown Document",
            questionsData: questions,
            resultsData: newResults,
            totalScore,
            averageScore,
          }),
        })

        const saveResult = await response.json()
        if (saveResult.success) {
          console.log("✅ Results saved to database")
        }
      } catch (saveError) {
        console.error("❌ Failed to save results:", saveError)
      }
    } catch (error) {
      console.error("❌ Submission error:", error)
      alert("Error submitting answers. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getWordCount = (questionId: number) => {
    const answer = answers[questionId] || ""
    return answer
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  // Profile Modal - Choose between bypass or actual form
  if (showProfileModal) {
    if (useBypassModal) {
      // TEMPORARY BYPASS MODAL
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Construction className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Profile Setup</CardTitle>
              <CardDescription className="text-gray-600">
                We're building a personalized profile system for better feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>
                    {studentData?.name} {studentData?.surname}
                  </strong>{" "}
                  ({studentData?.studentNumber})
                </p>
                <p className="text-xs text-blue-600">{studentData?.email}</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start gap-2">
                  <Construction className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800 mb-1">Profile System Under Development</p>
                    <p className="text-xs text-orange-700">
                      We're creating a personalized profile system that will provide tailored feedback for your
                      reflection questions based on your career goals and background.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleSkipProfile}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Continue to Assessment
                </Button>

                <Button
                  variant="outline"
                  disabled
                  className="w-full border-gray-300 text-gray-400 cursor-not-allowed bg-transparent"
                >
                  Complete Profile (Coming Soon)
                </Button>
              </div>

              {/* DEVELOPMENT TOGGLE */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Development Mode:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseBypassModal(false)}
                    className="text-xs border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Test Profile Form
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg border">
                <p className="font-medium mb-1">🚀 Coming Soon:</p>
                <ul className="space-y-1">
                  <li>• Personalized career advice in reflection questions</li>
                  <li>• Feedback tailored to your industry and goals</li>
                  <li>• Recommendations based on your experience level</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    } else {
      // ACTUAL PROFILE FORM
      return (
        <StudentProfileModal studentData={studentData!} onComplete={handleProfileComplete} onSkip={handleSkipProfile} />
      )
    }
  }

  // Student verification form
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">TechPreneur Assessment</CardTitle>
            <CardDescription className="text-gray-600">
              Please enter your details to access the assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Connection Status */}
            <div
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                aiConnectionStatus === "connected"
                  ? "bg-green-50 border-green-200"
                  : aiConnectionStatus === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
              }`}
            >
              {aiConnectionStatus === "testing" && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-700">Testing AI connection...</span>
                </>
              )}
              {aiConnectionStatus === "connected" && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">AI system ready</span>
                </>
              )}
              {aiConnectionStatus === "error" && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">{aiTestMessage}</span>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  First Name
                </Label>
                <Input
                  id="name"
                  value={verificationForm.name}
                  onChange={(e) => setVerificationForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your first name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname" className="text-sm font-medium text-gray-700">
                  Last Name
                </Label>
                <Input
                  id="surname"
                  value={verificationForm.surname}
                  onChange={(e) => setVerificationForm((prev) => ({ ...prev, surname: e.target.value }))}
                  placeholder="Enter your last name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentNumber" className="text-sm font-medium text-gray-700">
                Student Number
              </Label>
              <Input
                id="studentNumber"
                value={verificationForm.studentNumber}
                onChange={(e) => setVerificationForm((prev) => ({ ...prev, studentNumber: e.target.value }))}
                placeholder="Enter your student number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={verificationForm.email}
                onChange={(e) => setVerificationForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {profileStatus && (
              <div
                className={`p-3 rounded-lg border ${
                  profileStatus.includes("✅")
                    ? "bg-green-50 border-green-200 text-green-800"
                    : profileStatus.includes("⚠️")
                      ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <p className="text-sm font-medium">{profileStatus}</p>
              </div>
            )}

            <Button
              onClick={handleStudentVerification}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              disabled={aiConnectionStatus === "error"}
            >
              {aiConnectionStatus === "error" ? "AI System Unavailable" : "Verify Student"}
            </Button>

            {aiConnectionStatus === "error" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">
                  <strong>Assessment unavailable:</strong> AI grading system is not responding. Please contact your
                  instructor or try again later.
                </p>
                <Button
                  onClick={testAIConnection}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                >
                  Retry AI Connection
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg border">
              <p className="font-medium mb-1">📋 Instructions:</p>
              <ul className="space-y-1">
                <li>• Use your official university student number</li>
                <li>• Only approved students can access the platform</li>
                <li>• AI system must be working for assessment</li>
                {hasProfile && <li>• 🎯 Personalized feedback available for reflection questions</li>}
              </ul>
            </div>

            {/* Admin Access Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Administrator Access</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/admin")}
                className="text-xs border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
              >
                Admin Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show enhanced student report if available
  if (showReport && reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <StudentReport
            report={reportData.report || ""}
            metadata={
              reportData.metadata || {
                totalScore: 0,
                totalPossible: 0,
                overallPercentage: "0.0",
                cognitiveBreakdown: {},
                questionsCompleted: 0,
              }
            }
            studentData={studentData!}
            onDownload={downloadReport}
          />
        </div>
      </div>
    )
  }

  // Main assessment interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with student info */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  TechPreneur Assessment
                </CardTitle>
                <CardDescription>
                  Welcome, {studentData?.name} {studentData?.surname} ({studentData?.studentNumber})
                  {hasProfile && (
                    <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
                      <Star className="h-3 w-3 mr-1" />
                      Personalized Feedback Enabled
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  {currentDocument?.title || "No Document"}
                </Badge>
                {/* Profile Settings button */}
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProfileModal(true)}
                    className="text-xs border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Profile Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Assessment content */}
        {questions.length === 0 ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Ready to Start Assessment</CardTitle>
              <CardDescription>
                {currentDocument
                  ? `Assessment based on: ${currentDocument.title} (Week ${currentDocument.week_number})`
                  : "No document selected for assessment"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {currentDocument ? (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-700">
                      Assessment questions will be generated based on the course material.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      ✨ Each assessment generates unique questions for maximum variety
                    </p>
                    {hasProfile && (
                      <p className="text-xs text-purple-600 mt-1 font-medium">
                        🎯 Personalized feedback will be provided for reflection questions
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={generateQuestions}
                    disabled={isLoadingQuestions || aiConnectionStatus !== "connected"}
                    className="flex items-center gap-2"
                  >
                    {isLoadingQuestions ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating Unique Questions...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Generate New Assessment Questions
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-gray-600">No document available for assessment.</p>
                  <p className="text-sm text-gray-500">Please contact your instructor to set up course materials.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : !isComplete ? (
          <div className="space-y-6">
            {/* Questions and Answers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Assessment Questions
                </CardTitle>
                <CardDescription>
                  Complete all {questions.length} questions below, then submit for AI grading
                  {hasProfile && (
                    <span className="text-purple-600 font-medium ml-2">
                      • Personalized feedback enabled for reflection questions
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((question, index) => {
                  const wordCount = getWordCount(question.id)
                  const minWords = question.cognitiveType === "Reflection" ? 300 : 60

                  return (
                    <div key={question.id} className="p-4 border rounded-lg border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">Question {question.id}</h3>
                            <Badge className={`border ${getCognitiveBadgeStyle(question.cognitiveType)}`}>
                              {question.cognitiveType}
                            </Badge>
                            <Badge variant="secondary">
                              {question.cognitiveType === "Reflection" ? "50" : "10"} points
                            </Badge>
                            {question.cognitiveType === "Reflection" && hasProfile && (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                <Star className="h-3 w-3 mr-1" />
                                Personalized
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{question.question}</p>
                          <p className="text-xs text-gray-600">{question.cognitiveDescription}</p>
                        </div>
                      </div>

                      <CognitiveGuidance cognitiveType={question.cognitiveType} />

                      <Textarea
                        value={answers[question.id] || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder={`Write your ${question.cognitiveType.toLowerCase()} answer here (minimum ${minWords} words)...${
                          question.cognitiveType === "Reflection" && hasProfile
                            ? " Your response will receive personalized feedback based on your profile."
                            : ""
                        }`}
                        rows={question.cognitiveType === "Reflection" ? 8 : 4}
                        className="mt-3"
                      />

                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-sm ${wordCount >= minWords ? "text-green-600" : "text-red-600"}`}>
                          Word count: {wordCount} {wordCount < minWords && `(need ${minWords - wordCount} more)`}
                        </span>
                        <span className="text-xs text-gray-500">
                          Max: {question.cognitiveType === "Reflection" ? "50" : "10"} points
                        </span>
                      </div>
                    </div>
                  )
                })}

                <div className="text-center pt-4">
                  <Button
                    onClick={submitAllAnswers}
                    disabled={isSubmitting || questions.some((q) => !answers[q.id]?.trim())}
                    className="px-8 py-3 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        AI Analyzing Answers...
                      </>
                    ) : (
                      `Submit All ${questions.length} Answers`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Results Display with Report Generation */
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Assessment Complete!
                </CardTitle>
                <CardDescription>Your responses have been graded and saved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-blue-600">
                    {results.length > 0
                      ? (
                          (results.reduce((sum, r) => sum + r.score, 0) /
                            questions.reduce((sum, q) => sum + (q.cognitiveType === "Reflection" ? 50 : 10), 0)) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </div>
                  <p className="text-gray-600">Overall Percentage</p>

                  {/* Report Generation Button */}
                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={generateStudentReport}
                      disabled={isGeneratingReport}
                      className="flex items-center gap-2"
                    >
                      {isGeneratingReport ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Generate Complete Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Results */}
            <div className="space-y-4">
              {results.map((result, index) => {
                const maxScore = result.cognitiveType === "Reflection" ? 50 : 10
                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Question {result.questionId}
                          {result.personalized && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              <Star className="h-3 w-3 mr-1" />
                              Personalized
                            </Badge>
                          )}
                        </CardTitle>
                        <Badge
                          variant={
                            result.score >= maxScore * 0.7
                              ? "default"
                              : result.score >= maxScore * 0.5
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {result.score}/{maxScore}
                        </Badge>
                      </div>
                      <CardDescription>{result.question}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Your Answer:</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">{result.answer}</div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2 text-blue-700">
                            📝 Feedback:
                            {result.personalized && <Star className="h-3 w-3 text-purple-600" />}
                          </h4>
                          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">{result.feedback}</div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2 text-green-700">✅ Strengths:</h4>
                          <div className="bg-green-50 p-3 rounded text-sm text-green-800">{result.strengths}</div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2 text-orange-700">
                            🎯 Improvements:
                            {result.personalized && <Star className="h-3 w-3 text-purple-600 ml-1" />}
                          </h4>
                          <div className="bg-orange-50 p-3 rounded text-sm text-orange-800">{result.improvements}</div>
                        </div>
                      </div>

                      {/* PERSONALIZED ADVICE SECTIONS */}
                      {result.personalizedAdvice && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2 text-purple-800">
                            <User className="h-4 w-4" />🎯 Personalized Career Advice:
                          </h4>
                          <div className="text-sm text-purple-800">{result.personalizedAdvice}</div>
                        </div>
                      )}

                      {result.nextSteps && (
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2 text-indigo-800">
                            🚀 Next Steps for You:
                          </h4>
                          <div className="text-sm text-indigo-800 whitespace-pre-line">{result.nextSteps}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
