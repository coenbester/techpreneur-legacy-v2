"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface ProcessingResult {
  fileName: string
  studentName: string
  studentNumber: string
  status: "processing" | "success" | "error"
  message: string
  profile?: any
  error?: string
}

export default function ProfileUploadInterfaceSimple() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([])
  const [currentProgress, setCurrentProgress] = useState(0)
  const [overallMessage, setOverallMessage] = useState("")

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
    setProcessingResults([])
    setOverallMessage(`📁 Selected ${files.length} profile document(s)`)
  }

  const extractStudentInfoFromFilename = (fileName: string) => {
    const cleanName = fileName.replace(/\.(docx|doc|txt|pdf)$/i, "")

    // Try format 1: Surname.Initial.StudentNumber
    const dotParts = cleanName.split(".")
    if (dotParts.length >= 3) {
      const surname = dotParts[0]
      const initial = dotParts[1]
      const studentNumber = dotParts[2]
      return {
        name: `${surname} ${initial}`,
        number: studentNumber,
      }
    }

    // Try to extract student number (8 digits)
    const numberMatch = cleanName.match(/(\d{8})/)
    if (numberMatch) {
      const studentNumber = numberMatch[1]
      const nameWithoutNumber = cleanName.replace(studentNumber, "").replace(/[_-]/g, " ").trim()
      return {
        name: nameWithoutNumber || "Unknown Student",
        number: studentNumber,
      }
    }

    // Fallback
    return {
      name: cleanName.replace(/[_-]/g, " ").trim() || "Unknown Student",
      number: "Unknown",
    }
  }

  const processFile = async (file: File): Promise<ProcessingResult> => {
    const { name: studentName, number: studentNumber } = extractStudentInfoFromFilename(file.name)

    try {
      // Read file content
      let profileText = ""

      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        profileText = await file.text()
      } else if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        // For Word documents, we'll do basic text extraction
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(uint8Array)

        // Extract readable text (basic approach)
        const textMatches = text.match(/[\w\s.,!?;:'"()-]+/g)
        if (textMatches) {
          profileText = textMatches.join(" ").replace(/\s+/g, " ").trim()
        }
      } else {
        throw new Error("Unsupported file type. Please use .txt or .docx files.")
      }

      if (profileText.length < 100) {
        throw new Error("Could not extract sufficient text from document")
      }

      // For now, just return success without saving to database
      // This allows testing the file processing without the database table
      return {
        fileName: file.name,
        studentName,
        studentNumber,
        status: "success",
        message: "Profile text extracted successfully (database save disabled until table is created)",
        profile: {
          textLength: profileText.length,
          preview: profileText.substring(0, 200) + "...",
        },
      }
    } catch (error: any) {
      return {
        fileName: file.name,
        studentName,
        studentNumber,
        status: "error",
        message: error.message || "Unknown error",
        error: error.message,
      }
    }
  }

  const processAllFiles = async () => {
    if (selectedFiles.length === 0) {
      setOverallMessage("❌ Please select files first")
      return
    }

    setIsProcessing(true)
    setCurrentProgress(0)
    setOverallMessage("📄 Processing profile documents...")

    const results: ProcessingResult[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]

      // Update progress
      setCurrentProgress((i / selectedFiles.length) * 100)

      // Add processing status
      const processingResult: ProcessingResult = {
        fileName: file.name,
        studentName: "Processing...",
        studentNumber: "Processing...",
        status: "processing",
        message: "Extracting text from document...",
      }

      results.push(processingResult)
      setProcessingResults([...results])

      // Process the file
      const result = await processFile(file)

      // Update the result
      results[i] = result
      setProcessingResults([...results])
    }

    setCurrentProgress(100)

    const successCount = results.filter((r) => r.status === "success").length
    const errorCount = results.filter((r) => r.status === "error").length

    setOverallMessage(`✅ Processing complete! ${successCount} successful, ${errorCount} errors`)
    setIsProcessing(false)
  }

  const clearResults = () => {
    setSelectedFiles([])
    setProcessingResults([])
    setOverallMessage("")
    setCurrentProgress(0)

    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>👤</span>
          Student Profile Document Processing (Test Mode)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Important Notice */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Database Setup Required</h4>
          <p className="text-sm text-yellow-700">
            The student_profiles table needs to be created in your Supabase database first. This interface will test
            file processing but won't save to the database yet.
          </p>
          <p className="text-xs text-yellow-600 mt-2">
            Run the SQL script: scripts/create-student-profiles-table-v2.sql in your Supabase SQL editor.
          </p>
        </div>

        {/* File Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Student Profile Documents</label>
            <input
              type="file"
              multiple
              accept=".txt,.docx,.doc"
              onChange={handleFileSelection}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p>
                <strong>✅ Supported formats:</strong> .txt, .docx, .doc
              </p>
              <p>
                <strong>📝 Filename formats:</strong>
              </p>
              <ul className="ml-4 space-y-1">
                <li>• "Surname.Initial.StudentNumber.pre_assignment.docx"</li>
                <li>• "StudentNumber_Surname_Initial.docx"</li>
                <li>• "Surname Initial - StudentNumber.docx"</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={processAllFiles} disabled={selectedFiles.length === 0 || isProcessing} className="flex-1">
              {isProcessing
                ? `📄 Processing ${selectedFiles.length} files...`
                : `Test Process ${selectedFiles.length} Profile(s)`}
            </Button>

            {processingResults.length > 0 && (
              <Button variant="outline" onClick={clearResults} disabled={isProcessing}>
                Clear Results
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing files...</span>
              <span>{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="w-full" />
          </div>
        )}

        {/* Overall Message */}
        {overallMessage && (
          <div
            className={`p-3 rounded-lg ${
              overallMessage.includes("✅")
                ? "bg-green-50 text-green-700 border border-green-200"
                : overallMessage.includes("❌")
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            <p className="font-medium">{overallMessage}</p>
          </div>
        )}

        {/* Processing Results */}
        {processingResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Processing Results:</h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {processingResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === "success"
                      ? "bg-green-50 border-green-200"
                      : result.status === "error"
                        ? "bg-red-50 border-red-200"
                        : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">
                        {result.studentName} ({result.studentNumber})
                      </p>
                      <p className="text-xs text-gray-500">{result.fileName}</p>
                    </div>
                    <Badge
                      variant={
                        result.status === "success"
                          ? "default"
                          : result.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {result.status === "processing" && "⏳ Processing"}
                      {result.status === "success" && "✅ Success"}
                      {result.status === "error" && "❌ Error"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">{result.message}</p>

                  {result.profile && (
                    <div className="text-xs text-gray-600 space-y-1 bg-white p-2 rounded border">
                      <p>
                        <strong>Text Length:</strong> {result.profile.textLength} characters
                      </p>
                      <p>
                        <strong>Preview:</strong> {result.profile.preview}
                      </p>
                    </div>
                  )}

                  {result.error && (
                    <div className="text-xs text-red-600 bg-red-100 p-2 rounded border">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">📋 Next Steps:</h4>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Create the student_profiles table in Supabase using the SQL script</li>
            <li>Test file processing with this interface</li>
            <li>Once the table is created, enable full AI processing and database saving</li>
            <li>Use the processed profiles for personalized grading</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
