"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, Award, TrendingUp, BookOpen, Target, Lightbulb } from "lucide-react"

interface StudentReportProps {
  report: string
  metadata: {
    totalScore: number
    totalPossible: number
    overallPercentage: string
    cognitiveBreakdown: { [key: string]: { average: string; count: number } }
    questionsCompleted: number
  }
  studentData: {
    name: string
    surname: string
    studentNumber: string
  }
  onDownload: () => void
}

export function StudentReport({ report, metadata, studentData, onDownload }: StudentReportProps) {
  // Add null checks and default values to prevent build errors
  const safeMetadata = metadata || {
    totalScore: 0,
    totalPossible: 0,
    overallPercentage: "0.0",
    cognitiveBreakdown: {},
    questionsCompleted: 0,
  }

  const safeStudentData = studentData || {
    name: "Unknown",
    surname: "Student",
    studentNumber: "N/A",
  }

  const getCognitiveColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Remember: "bg-blue-100 text-blue-800 border-blue-200",
      Understand: "bg-green-100 text-green-800 border-green-200",
      Apply: "bg-purple-100 text-purple-800 border-purple-200",
      Analyze: "bg-orange-100 text-orange-800 border-orange-200",
      Evaluate: "bg-red-100 text-red-800 border-red-200",
      Reflection: "bg-indigo-100 text-indigo-800 border-indigo-200",
    }
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: "Excellent", color: "text-green-600" }
    if (percentage >= 80) return { label: "Very Good", color: "text-blue-600" }
    if (percentage >= 70) return { label: "Good", color: "text-yellow-600" }
    if (percentage >= 60) return { label: "Satisfactory", color: "text-orange-600" }
    return { label: "Needs Improvement", color: "text-red-600" }
  }

  const percentageValue = Number.parseFloat(safeMetadata.overallPercentage) || 0
  const performanceLevel = getPerformanceLevel(percentageValue)

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Award className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Performance Report</CardTitle>
          <div className="text-lg text-gray-600">
            {safeStudentData.name} {safeStudentData.surname} • {safeStudentData.studentNumber}
          </div>
          <div className="mt-4">
            <div className="text-5xl font-bold text-blue-600 mb-2">{safeMetadata.overallPercentage}%</div>
            <div className={`text-xl font-semibold ${performanceLevel.color} mb-2`}>{performanceLevel.label}</div>
            <div className="text-gray-600">
              {safeMetadata.totalScore} out of {safeMetadata.totalPossible} points
            </div>
            <Progress value={percentageValue} className="h-3 max-w-md mx-auto mt-4" />
          </div>
        </CardHeader>
      </Card>

      {/* Cognitive Skills Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cognitive Skills Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(safeMetadata.cognitiveBreakdown).map(([type, data]) => (
              <div key={type} className="p-4 rounded-lg border bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`${getCognitiveColor(type)} border`}>{type}</Badge>
                  <span className="text-sm text-gray-600">
                    {data.count} question{data.count > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{data.average}%</div>
                <Progress value={Number.parseFloat(data.average) || 0} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            AI Analysis Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {report ? report.substring(0, 1000) + "..." : "Report content will appear here..."}
            </pre>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Complete Report Includes:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Executive summary with AI performance analysis</li>
                  <li>• Detailed cognitive skills breakdown</li>
                  <li>• All questions with your complete answers</li>
                  <li>• Specific feedback and improvement recommendations</li>
                  <li>• Personalized learning path suggestions</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Target className="h-5 w-5" />
            Download Your Complete Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              Get your comprehensive assessment report with all questions, answers, and AI analysis. Perfect for
              academic portfolios and future reference.
            </p>
            <Button onClick={onDownload} size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
              <Download className="h-5 w-5 mr-2" />
              Download Complete Report
            </Button>
            <div className="text-xs text-gray-500">
              Report includes all assessment data • Generated {new Date().toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentReport
