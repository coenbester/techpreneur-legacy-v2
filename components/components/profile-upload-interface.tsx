"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"

export default function ProfileUploadInterface() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/process-profile-document", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Upload failed")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Upload error:", err)
    }

    setUploading(false)
  }

  const resetUpload = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            AI-Powered Profile Upload (Experimental)
          </CardTitle>
          <CardDescription>
            Upload documents containing student information and let AI extract profile data automatically. This feature
            is experimental - manual entry is recommended for accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium">Choose a file to upload</span>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </Label>
              <p className="text-sm text-gray-500">Supported formats: .txt, .md, .pdf, .doc, .docx</p>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
              <Button onClick={resetUpload} variant="ghost" size="sm">
                Remove
              </Button>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing document...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={!file || uploading} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {uploading ? "Processing..." : "Upload & Process"}
            </Button>
            {file && (
              <Button onClick={resetUpload} variant="outline">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Upload Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Recommendation:</strong> For best results, use the manual profile entry form instead. The AI
                extraction is experimental and may not capture all information accurately.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Processing Complete
            </CardTitle>
            <CardDescription>Document processed successfully. Review the extracted information below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.extractedProfile && (
              <div>
                <h4 className="font-medium mb-2">Extracted Profile Information:</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(result.extractedProfile, null, 2)}</pre>
                </div>
              </div>
            )}

            {result.rawContent && (
              <div>
                <h4 className="font-medium mb-2">Raw Extracted Content:</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm max-h-64 overflow-y-auto">
                  <p>{result.rawContent}</p>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Next Steps:</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Review the extracted information and manually create or update the student profile using the "Manual
                    Entry" tab for accuracy. AI extraction is experimental and may miss important details.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            Important Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-yellow-800">
            <p>
              <strong>This AI upload feature is experimental.</strong> While it can help extract basic information from
              documents, it may not capture all nuances or context accurately.
            </p>
            <p>
              <strong>For best results:</strong> Use the manual profile entry form where you can carefully input and
              verify all student information.
            </p>
            <p>
              <strong>Always review:</strong> Any AI-extracted data should be manually reviewed and corrected before
              saving to ensure accuracy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
