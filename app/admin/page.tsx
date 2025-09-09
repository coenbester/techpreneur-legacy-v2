"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import ProfileUploadInterface from "@/components/profile-upload-interface"
import ProfileFormInterface from "@/components/profile-form-interface"
import {
  getStudents,
  getAllStudentProfiles,
  getAllAssessmentResults,
  deleteAssessmentResults,
  deleteStudentsByPattern,
} from "@/lib/supabase"
import {
  Users,
  FileText,
  Settings,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle,
  LogOut,
  Shield,
  Eye,
  Award,
  Brain,
  BookOpen,
  Star,
  Plus,
  User,
  Briefcase,
  Target,
  Lightbulb,
  GraduationCap,
  Calendar,
  RefreshCw,
} from "lucide-react"

interface Student {
  id: string
  name: string
  student_number: string
  email: string
  created_at: string
}

interface StudentProfile {
  id: string
  student_id: string
  // Standard fields
  current_role: string | null
  company_type: string | null
  industry_experience: string | null
  education_background: string | null
  years_experience: number | null
  previous_startups: string | null
  entrepreneurial_experience: string | null
  key_skills: string | null
  technology_interests: string | null
  career_goals: string | null
  learning_objectives: string | null
  full_profile_text: string | null
  // Additional fields from uploads
  qualification_level?: string | null
  qualification_discipline?: string | null
  work_experience_years?: string | null
  startup_exposure?: string | null
  current_responsibilities?: string | null
  career_goal?: string | null
  biggest_challenge?: string | null
  industry?: string | null
  created_at: string
  updated_at: string
  students: {
    student_number: string
    name: string
    email: string
  }
}

interface AssessmentResult {
  id: string
  student_id: string
  lecture_title: string
  document_name: string
  total_score: number
  average_score: number
  completed_at: string
  results_data: Array<{
    question: string
    answer: string
    score: number
    feedback: string
    strengths: string
    improvements: string
    cognitiveType: string
  }>
  students: {
    name: string
    student_number: string
    email: string
  }
}

interface Document {
  id: string
  title: string
  content: string
  week_number: number
  is_current: boolean
  created_at: string
}

export default function AdminDashboard() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Data states
  const [students, setStudents] = useState<Student[]>([])
  const [profiles, setProfiles] = useState<StudentProfile[]>([])
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [approvedStudents, setApprovedStudents] = useState<string[]>([])
  const [documents, setDocuments] = useState<Document[]>([])

  // Modal state for viewing assessment details
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Document management states
  const [newDocTitle, setNewDocTitle] = useState("")
  const [newDocContent, setNewDocContent] = useState("")
  const [newDocWeek, setNewDocWeek] = useState("")
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMethod, setUploadMethod] = useState<"file" | "paste">("file")

  // Loading states
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)

  // Check authentication on load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData()
    }
  }, [isAuthenticated])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const result = await response.json()
      if (result.authenticated) {
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.log("Not authenticated")
    }
  }

  const handleLogin = async () => {
    if (!password.trim()) {
      setLoginError("Please enter the admin password")
      return
    }

    setIsLoggingIn(true)
    setLoginError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (result.success) {
        setIsAuthenticated(true)
        setPassword("")
      } else {
        setLoginError("Invalid password")
      }
    } catch (error) {
      setLoginError("Login failed. Please try again.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setIsAuthenticated(false)
      setPassword("")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const loadAllData = async () => {
    await Promise.all([loadStudents(), loadProfiles(), loadResults(), loadApprovedStudents(), loadDocuments()])
  }

  const loadStudents = async () => {
    setIsLoadingStudents(true)
    try {
      const result = await getStudents()
      if (result.success && result.data) {
        setStudents(result.data)
      }
    } catch (error) {
      console.error("Failed to load students:", error)
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const loadProfiles = async () => {
    setIsLoadingProfiles(true)
    try {
      console.log("🔄 Admin: Loading profiles...")
      const result = await getAllStudentProfiles()
      console.log("📊 Admin: Profile load result:", result)

      if (result.success && result.data) {
        console.log("✅ Admin: Setting profiles:", result.data.length)
        console.log("🔍 Admin: First profile structure:", JSON.stringify(result.data[0], null, 2))
        setProfiles(result.data)
      } else {
        console.error("❌ Admin: Failed to load profiles:", result.error)
      }
    } catch (error) {
      console.error("❌ Admin: Failed to load profiles:", error)
    } finally {
      setIsLoadingProfiles(false)
    }
  }

  const loadResults = async () => {
    setIsLoadingResults(true)
    try {
      const data = await getAllAssessmentResults()
      setResults(data)
    } catch (error) {
      console.error("Failed to load results:", error)
    } finally {
      setIsLoadingResults(false)
    }
  }

  const loadDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      const response = await fetch("/api/documents")
      const result = await response.json()
      if (result.success) {
        setDocuments(result.documents || [])
      }
    } catch (error) {
      console.error("Failed to load documents:", error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const loadApprovedStudents = async () => {
    try {
      const response = await fetch("/approved-students.csv")
      if (response.ok) {
        const csvText = await response.text()
        const lines = csvText.split("\n")
        const studentNumbers = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line) {
            // Split by tabs since the CSV uses tabs
            const columns = line.split("\t")
            if (columns.length >= 3) {
              const studentNumber = columns[2]?.trim().replace(/"/g, "")
              if (studentNumber) {
                studentNumbers.push(studentNumber)
              }
            }
          }
        }
        setApprovedStudents(studentNumbers)
      }
    } catch (error) {
      console.error("Failed to load approved students:", error)
    }
  }

  const handleDeleteResults = async (resultIds: string[]) => {
    if (!confirm(`Delete ${resultIds.length} assessment result(s)?`)) return

    try {
      await deleteAssessmentResults(resultIds)
      await loadResults()
      alert("Results deleted successfully")
    } catch (error) {
      alert("Failed to delete results")
    }
  }

  const handleDeleteStudents = async (pattern: string) => {
    if (!pattern.trim()) {
      alert("Please enter a pattern to delete students")
      return
    }

    if (!confirm(`Delete all students with names containing "${pattern}"?`)) return

    try {
      const result = await deleteStudentsByPattern(pattern)
      await loadAllData()
      alert(`Deleted ${result.deletedCount} students and their data`)
    } catch (error) {
      alert("Failed to delete students")
    }
  }

  const handleViewResult = (result: AssessmentResult) => {
    setSelectedResult(result)
    setIsModalOpen(true)
  }

  const handleViewProfile = (profile: StudentProfile) => {
    setSelectedProfile(profile)
    setIsProfileModalOpen(true)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      setNewDocTitle(nameWithoutExt)
    }
  }

  const handleUploadDocument = async () => {
    if (!newDocTitle.trim() || !newDocWeek.trim()) {
      alert("Please fill in title and week number")
      return
    }

    if (uploadMethod === "file" && !selectedFile) {
      alert("Please select a file to upload")
      return
    }

    if (uploadMethod === "paste" && !newDocContent.trim()) {
      alert("Please paste document content")
      return
    }

    setIsUploadingDoc(true)
    try {
      let content = newDocContent

      if (uploadMethod === "file" && selectedFile) {
        // Process file upload
        const formData = new FormData()
        formData.append("file", selectedFile)

        const uploadResponse = await fetch("/api/process-file", {
          method: "POST",
          body: formData,
        })

        const uploadResult = await uploadResponse.json()
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to process file")
        }

        content = uploadResult.content
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle,
          content: content,
          weekNumber: Number.parseInt(newDocWeek),
        }),
      })

      const result = await response.json()
      if (result.success) {
        setNewDocTitle("")
        setNewDocContent("")
        setNewDocWeek("")
        setSelectedFile(null)
        await loadDocuments()
        alert("Document uploaded successfully!")
      } else {
        alert("Failed to upload document: " + result.error)
      }
    } catch (error) {
      alert("Failed to upload document: " + error.message)
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleSetCurrentDocument = async (documentId: string) => {
    try {
      const response = await fetch("/api/documents/set-current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      })

      const result = await response.json()
      if (result.success) {
        await loadDocuments()
        alert("Document set as current successfully!")
      } else {
        alert("Failed to set current document: " + result.error)
      }
    } catch (error) {
      alert("Failed to set current document")
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        await loadDocuments()
        alert("Document deleted successfully!")
      } else {
        alert("Failed to delete document: " + result.error)
      }
    } catch (error) {
      alert("Failed to delete document")
    }
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  // Get max points for cognitive type
  const getMaxPoints = (cognitiveType: string) => {
    return cognitiveType === "Reflection" ? 50 : 10
  }

  // Helper function to safely truncate text
  const safeSubstring = (text: string | null | undefined, length = 100): string => {
    if (!text) return "Not specified"
    return text.length > length ? text.substring(0, length) + "..." : text
  }

  // Helper function to get field value with fallback - HANDLES BOTH FIELD STRUCTURES
  const getFieldValue = (
    profile: StudentProfile,
    primaryField: keyof StudentProfile,
    fallbackField?: string,
  ): string => {
    const primary = profile[primaryField]
    if (primary && primary !== null && primary !== "") return String(primary)

    if (fallbackField && (profile as any)[fallbackField]) {
      const fallback = (profile as any)[fallbackField]
      if (fallback && fallback !== null && fallback !== "") return String(fallback)
    }

    return "Not specified"
  }

  // Helper function to format experience level
  const formatExperienceLevel = (level: string | null): string => {
    if (!level) return "Not specified"
    const levels: { [key: string]: string } = {
      none: "No Experience",
      beginner: "Beginner",
      some: "Some Experience",
      experienced: "Experienced",
      serial: "Serial Entrepreneur",
    }
    return levels[level] || level
  }

  // Helper function to format company type
  const formatCompanyType = (type: string | null): string => {
    if (!type) return "Not specified"
    const types: { [key: string]: string } = {
      startup: "Startup",
      corporate: "Large Corporation",
      sme: "Small/Medium Enterprise",
      nonprofit: "Non-Profit",
      government: "Government",
      consulting: "Consulting",
      university: "University/Academic",
      freelance: "Freelance/Self-Employed",
    }
    return types[type] || type
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>Enter the admin password to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
              />
            </div>

            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full">
              {isLoggingIn ? "Authenticating..." : "Login"}
            </Button>

            <div className="text-center pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/")} className="text-xs">
                ← Back to Student Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription>Manage students, profiles, documents, and assessment results</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => (window.location.href = "/")}>
                  Student Portal
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profiles</p>
                  <p className="text-2xl font-bold">{profiles.length}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Documents</p>
                  <p className="text-2xl font-bold">{documents.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Results</p>
                  <p className="text-2xl font-bold">{results.length}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold">{approvedStudents.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="upload">AI Upload</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Registered Students ({students.length})
                  </CardTitle>
                  <CardDescription>Students who have accessed the assessment system</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStudents ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading students...</p>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No students registered yet</div>
                  ) : (
                    <div className="space-y-4">
                      {students.map((student) => (
                        <div key={student.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{student.name}</h3>
                            <p className="text-sm text-gray-600">
                              Student #: {student.student_number} | {student.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              Registered: {new Date(student.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={approvedStudents.includes(student.student_number) ? "default" : "destructive"}
                          >
                            {approvedStudents.includes(student.student_number) ? "Approved" : "Not Approved"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Approved Student Numbers ({approvedStudents.length})</CardTitle>
                  <CardDescription>Student numbers allowed to access the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    {approvedStudents.map((number, index) => (
                      <Badge key={index} variant="secondary">
                        {number}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profiles Tab - FIXED TO HANDLE BOTH FIELD STRUCTURES */}
          <TabsContent value="profiles">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Complete Student Profiles ({profiles.length})
                    </CardTitle>
                    <CardDescription>Detailed profiles for personalized feedback and career guidance</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadProfiles}
                    disabled={isLoadingProfiles}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingProfiles ? "animate-spin" : ""}`} />
                    Refresh Profiles
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingProfiles ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading profiles...</p>
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No student profiles found</p>
                    <p className="text-sm mt-2">
                      Profiles are created when students complete the profile form or upload documents
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {profiles.map((profile) => (
                      <Card key={profile.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">
                                    {profile.students?.name || "Unknown Student"}
                                  </CardTitle>
                                  <p className="text-sm text-gray-600">
                                    Student #: {profile.students?.student_number || "Unknown"} |{" "}
                                    {profile.students?.email || "No email"}
                                  </p>
                                </div>
                              </div>

                              {/* Quick Overview - FIXED TO USE BOTH FIELD STRUCTURES */}
                              <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">Current Role</p>
                                    <p className="text-sm font-medium">{getFieldValue(profile, "current_role")}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">Experience</p>
                                    <p className="text-sm font-medium">
                                      {getFieldValue(profile, "years_experience", "work_experience_years")}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">Entrepreneurial Level</p>
                                    <p className="text-sm font-medium">
                                      {getFieldValue(profile, "entrepreneurial_experience", "startup_exposure")}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete Profile
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProfile(profile)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Full Profile
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Lightbulb className="h-4 w-4 text-orange-500" />
                                <strong>Career Goals:</strong>
                              </div>
                              <p className="text-gray-600 ml-6">
                                {safeSubstring(getFieldValue(profile, "career_goals", "career_goal"), 150)}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-purple-500" />
                                <strong>Key Skills:</strong>
                              </div>
                              <p className="text-gray-600 ml-6">
                                {safeSubstring(getFieldValue(profile, "key_skills"), 150)}
                              </p>
                            </div>
                          </div>

                          {/* Show current responsibilities if available */}
                          {getFieldValue(profile, "current_responsibilities") !== "Not specified" && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center gap-2 mb-2">
                                <Briefcase className="h-4 w-4 text-blue-500" />
                                <strong className="text-sm">Current Responsibilities:</strong>
                              </div>
                              <p className="text-gray-600 text-sm ml-6">
                                {safeSubstring(getFieldValue(profile, "current_responsibilities"), 200)}
                              </p>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Created: {new Date(profile.created_at).toLocaleDateString()}
                              </div>
                              {profile.updated_at && profile.updated_at !== profile.created_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Updated: {new Date(profile.updated_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Profile ID: {profile.id.substring(0, 8)}...
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="space-y-6">
              {/* Upload New Document */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Upload New Document
                  </CardTitle>
                  <CardDescription>Add lecture materials for AI question generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    <Button
                      variant={uploadMethod === "file" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUploadMethod("file")}
                    >
                      Upload File
                    </Button>
                    <Button
                      variant={uploadMethod === "paste" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUploadMethod("paste")}
                    >
                      Paste Content
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="docTitle">Document Title</Label>
                      <Input
                        id="docTitle"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        placeholder="e.g., Entrepreneurship Fundamentals - Week 1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="docWeek">Week Number</Label>
                      <Input
                        id="docWeek"
                        type="number"
                        value={newDocWeek}
                        onChange={(e) => setNewDocWeek(e.target.value)}
                        placeholder="e.g., 1"
                      />
                    </div>
                  </div>

                  {uploadMethod === "file" ? (
                    <div>
                      <Label htmlFor="docFile">Select Document File</Label>
                      <Input
                        id="docFile"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={handleFileSelect}
                        className="cursor-pointer"
                      />
                      {selectedFile && (
                        <p className="text-sm text-gray-600 mt-2">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="docContent">Document Content</Label>
                      <Textarea
                        id="docContent"
                        value={newDocContent}
                        onChange={(e) => setNewDocContent(e.target.value)}
                        placeholder="Paste the lecture content here..."
                        rows={8}
                      />
                    </div>
                  )}

                  <Button onClick={handleUploadDocument} disabled={isUploadingDoc} className="w-full">
                    {isUploadingDoc ? "Processing..." : uploadMethod === "file" ? "Upload File" : "Upload Content"}
                  </Button>
                </CardContent>
              </Card>

              {/* Document Library */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Document Library ({documents.length})
                  </CardTitle>
                  <CardDescription>
                    Manage lecture documents and set the current document for assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDocuments ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading documents...</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No documents uploaded yet</div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{doc.title}</h3>
                                {doc.is_current && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <Star className="h-3 w-3 mr-1" />
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">Week {doc.week_number}</p>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">{safeSubstring(doc.content, 200)}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {!doc.is_current && (
                                <Button variant="outline" size="sm" onClick={() => handleSetCurrentDocument(doc.id)}>
                                  Set as Current
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={doc.is_current}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assessment Results ({results.length})
                </CardTitle>
                <CardDescription>Student assessment submissions and scores</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingResults ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading results...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No assessment results yet</div>
                ) : (
                  <div className="space-y-4">
                    {results.map((result) => (
                      <div key={result.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{result.students?.name || "Unknown Student"}</h3>
                            <p className="text-sm text-gray-600">
                              Student #: {result.students?.student_number || "Unknown"} | {result.lecture_title}
                            </p>
                            <p className="text-xs text-gray-500">
                              Completed: {new Date(result.completed_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <Badge
                                variant={
                                  result.average_score >= 7
                                    ? "default"
                                    : result.average_score >= 5
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {result.average_score.toFixed(1)}/10
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">Total: {result.total_score} points</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewResult(result)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Upload Tab */}
          <TabsContent value="upload">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Profile Upload Interface
                  </CardTitle>
                  <CardDescription>Upload and process student profile documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileUploadInterface />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual Profile Creation</CardTitle>
                  <CardDescription>Create profiles manually using the form interface</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileFormInterface />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Student Number Issue:</strong> If students get "Student number not found in approved
                      list", check that their number exists in the approved students list in the Students tab. The
                      system checks against the CSV file in the public folder.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Data Management</h3>
                    <div className="flex gap-4">
                      <Button onClick={() => loadAllData()} variant="outline">
                        Refresh All Data
                      </Button>
                      <Button
                        onClick={() => {
                          const pattern = prompt("Enter name pattern to delete students:")
                          if (pattern) handleDeleteStudents(pattern)
                        }}
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Students by Pattern
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">System Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Database Connected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Admin Authenticated</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Students: {students.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Documents: {documents.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Approved Numbers: {approvedStudents.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Assessment Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Assessment Details - {selectedResult?.students?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedResult && (
              <div className="space-y-6">
                {/* Header Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedResult.students?.name}</h3>
                      <p className="text-gray-600">Student #: {selectedResult.students?.student_number}</p>
                      <p className="text-sm text-gray-500">
                        {selectedResult.lecture_title} • {new Date(selectedResult.completed_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {selectedResult.average_score.toFixed(1)}/10
                      </div>
                      <div className="text-sm text-gray-600">{selectedResult.total_score} total points</div>
                    </div>
                  </div>
                  <Progress value={(selectedResult.average_score / 10) * 100} className="h-3" />
                </div>

                {/* Questions and Answers */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Questions & Responses
                  </h4>

                  {selectedResult.results_data?.map((item, index) => {
                    const maxPoints = getMaxPoints(item.cognitiveType)
                    return (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`${getCognitiveColor(item.cognitiveType)} border`}>
                                  {item.cognitiveType}
                                </Badge>
                                <span className={`font-bold text-lg ${getScoreColor(item.score)}`}>
                                  {item.score}/{maxPoints}
                                </span>
                              </div>
                              <CardTitle className="text-base">{item.question}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h5 className="font-semibold text-sm text-gray-700 mb-2">Student Answer:</h5>
                            <div className="bg-gray-50 p-3 rounded border text-sm">
                              {item.answer || "No answer provided"}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-semibold text-sm text-green-700 mb-2">Strengths:</h5>
                              <div className="bg-green-50 p-3 rounded border text-sm">
                                {item.strengths || "No strengths noted"}
                              </div>
                            </div>
                            <div>
                              <h5 className="font-semibold text-sm text-orange-700 mb-2">Areas for Improvement:</h5>
                              <div className="bg-orange-50 p-3 rounded border text-sm">
                                {item.improvements || "No improvements noted"}
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold text-sm text-blue-700 mb-2">Detailed Feedback:</h5>
                            <div className="bg-blue-50 p-3 rounded border text-sm">
                              {item.feedback || "No feedback provided"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }) || <div className="text-center py-8 text-gray-500">No detailed results data available</div>}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Profile Details Modal - ENHANCED TO SHOW ALL FIELDS */}
        <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Complete Profile - {selectedProfile?.students?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedProfile && (
              <div className="space-y-6">
                {/* Header Summary */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{selectedProfile.students.name}</h3>
                      <p className="text-gray-600">Student #: {selectedProfile.students.student_number}</p>
                      <p className="text-sm text-gray-500">{selectedProfile.students.email}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>Created: {new Date(selectedProfile.created_at).toLocaleDateString()}</span>
                        {selectedProfile.updated_at && selectedProfile.updated_at !== selectedProfile.created_at && (
                          <span>Updated: {new Date(selectedProfile.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Professional Background
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Current Role</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border">
                          {getFieldValue(selectedProfile, "current_role")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Company Type</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border">
                          {formatCompanyType(selectedProfile.company_type)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Industry Experience</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border">
                          {getFieldValue(selectedProfile, "industry_experience")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Years of Experience</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border">
                          {getFieldValue(selectedProfile, "years_experience", "work_experience_years")}
                        </p>
                      </div>
                    </div>

                    {/* Current Responsibilities - if available */}
                    {getFieldValue(selectedProfile, "current_responsibilities") !== "Not specified" && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Current Responsibilities</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                          {getFieldValue(selectedProfile, "current_responsibilities")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Education & Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education & Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Education Background</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border">
                          {getFieldValue(selectedProfile, "education_background")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Qualification Level</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border">
                          {getFieldValue(selectedProfile, "qualification_level")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Key Skills</Label>
                      <p className="mt-1 p-3 bg-gray-50 rounded border">
                        {getFieldValue(selectedProfile, "key_skills")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Technology Interests</Label>
                      <p className="mt-1 p-3 bg-gray-50 rounded border">
                        {getFieldValue(selectedProfile, "technology_interests")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Entrepreneurial Experience */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Entrepreneurial Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Experience Level</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border">
                          {getFieldValue(selectedProfile, "entrepreneurial_experience", "startup_exposure")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Industry</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border">
                          {getFieldValue(selectedProfile, "industry")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Previous Startups/Ventures</Label>
                      <p className="mt-1 p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                        {getFieldValue(selectedProfile, "previous_startups")}
                      </p>
                    </div>
                    {getFieldValue(selectedProfile, "biggest_challenge") !== "Not specified" && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Biggest Challenge</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                          {getFieldValue(selectedProfile, "biggest_challenge")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Goals & Objectives */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Goals & Learning Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Career Goals</Label>
                      <p className="mt-1 p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                        {getFieldValue(selectedProfile, "career_goals", "career_goal")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Learning Objectives</Label>
                      <p className="mt-1 p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                        {getFieldValue(selectedProfile, "learning_objectives")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Full Profile Text */}
                {selectedProfile.full_profile_text && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Complete Profile Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-gray-50 rounded border">
                        <p className="whitespace-pre-wrap text-sm">{selectedProfile.full_profile_text}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
