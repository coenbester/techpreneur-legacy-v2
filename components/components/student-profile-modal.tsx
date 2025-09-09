"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Save, Loader2 } from "lucide-react"

interface StudentData {
  id: string
  name: string
  surname: string
  studentNumber: string
  email: string
}

interface ProfileData {
  qualificationLevel: string
  qualificationDiscipline: string
  workExperienceYears: string
  currentRole: string
  industry: string
  startupExposure: string
  currentResponsibilities: string
  careerGoal: string
  biggestChallenge: string
}

interface StudentProfileModalProps {
  studentData: StudentData
  onComplete: () => void
  onSkip?: () => void
}

export default function StudentProfileModal({ studentData, onComplete, onSkip }: StudentProfileModalProps) {
  const [profileData, setProfileData] = useState<ProfileData>({
    qualificationLevel: "",
    qualificationDiscipline: "",
    workExperienceYears: "",
    currentRole: "",
    industry: "",
    startupExposure: "",
    currentResponsibilities: "",
    careerGoal: "",
    biggestChallenge: "",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  // Load existing profile when modal opens
  useEffect(() => {
    loadExistingProfile()
  }, [studentData.id])

  const loadExistingProfile = async () => {
    try {
      console.log("📋 PROFILE MODAL: Loading existing profile for:", studentData.id)
      setIsLoading(true)

      const response = await fetch(`/api/student-profile/${studentData.id}`)
      const result = await response.json()

      console.log("📋 PROFILE MODAL: Load result:", result)

      if (result.success && result.hasProfile && result.profile) {
        const profile = result.profile
        console.log("✅ PROFILE MODAL: Loading existing profile data")

        setProfileData({
          qualificationLevel: profile.qualification_level || "",
          qualificationDiscipline: profile.qualification_discipline || "",
          workExperienceYears: profile.work_experience_years || "",
          currentRole: profile.current_role || "",
          industry: profile.industry || "",
          startupExposure: profile.startup_exposure || "",
          currentResponsibilities: profile.current_responsibilities || "",
          careerGoal: profile.career_goal || "",
          biggestChallenge: profile.biggest_challenge || "",
        })
      } else {
        console.log("📝 PROFILE MODAL: No existing profile found, starting fresh")
      }
    } catch (error) {
      console.error("❌ PROFILE MODAL: Error loading profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateProfile = () => {
    const newErrors: string[] = []

    if (!profileData.qualificationLevel) newErrors.push("Qualification level is required")
    if (!profileData.qualificationDiscipline) newErrors.push("Qualification discipline is required")
    if (!profileData.workExperienceYears) newErrors.push("Work experience is required")
    if (!profileData.currentRole) newErrors.push("Current role is required")
    if (!profileData.industry) newErrors.push("Industry is required")
    if (!profileData.startupExposure) newErrors.push("Startup exposure is required")
    if (!profileData.currentResponsibilities.trim()) newErrors.push("Current responsibilities are required")
    if (!profileData.careerGoal.trim()) newErrors.push("Career goal is required")
    if (!profileData.biggestChallenge.trim()) newErrors.push("Biggest challenge is required")

    // Word count validation
    const responsibilitiesWords = profileData.currentResponsibilities.trim().split(/\s+/).length
    const careerGoalWords = profileData.careerGoal.trim().split(/\s+/).length
    const challengeWords = profileData.biggestChallenge.trim().split(/\s+/).length

    if (responsibilitiesWords > 100) newErrors.push("Current responsibilities must be 100 words or less")
    if (careerGoalWords > 50) newErrors.push("Career goal must be 50 words or less")
    if (challengeWords > 50) newErrors.push("Biggest challenge must be 50 words or less")

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSave = async () => {
    if (!validateProfile()) return

    setIsSaving(true)
    try {
      console.log("💾 PROFILE MODAL: Saving profile...")

      const response = await fetch("/api/save-student-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentData.id,
          profileData,
        }),
      })

      const result = await response.json()
      console.log("💾 PROFILE MODAL: Save result:", result)

      if (result.success) {
        console.log("✅ PROFILE MODAL: Profile saved successfully")
        onComplete()
      } else {
        console.error("❌ PROFILE MODAL: Profile save failed:", result.error)
        setErrors([result.error || "Failed to save profile"])
      }
    } catch (error) {
      console.error("❌ PROFILE MODAL: Profile save error:", error)
      setErrors(["Failed to save profile. Please try again."])
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
    if (errors.length > 0) setErrors([]) // Clear errors when user starts typing
  }

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Complete Your Profile</CardTitle>
          <CardDescription className="text-gray-600">
            Help us provide personalized feedback by completing your profile
          </CardDescription>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-4">
            <p className="text-sm text-blue-800">
              <strong>
                {studentData.name} {studentData.surname}
              </strong>{" "}
              ({studentData.studentNumber})
            </p>
            <p className="text-xs text-blue-600">{studentData.email}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Qualification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qualificationLevel">Highest Qualification Level *</Label>
              <Select
                value={profileData.qualificationLevel}
                onValueChange={(value) => updateField("qualificationLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select qualification level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificate">Certificate/Diploma</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="honours">Honours Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="doctoral">Doctoral Degree</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="qualificationDiscipline">Qualification Discipline *</Label>
              <Select
                value={profileData.qualificationDiscipline}
                onValueChange={(value) => updateField("qualificationDiscipline", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discipline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="business">Business/Commerce</SelectItem>
                  <SelectItem value="computer-science">Computer Science/IT</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="arts">Arts/Humanities</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Work Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workExperienceYears">Work Experience *</Label>
              <Select
                value={profileData.workExperienceYears}
                onValueChange={(value) => updateField("workExperienceYears", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">0-1 years</SelectItem>
                  <SelectItem value="2-3">2-3 years</SelectItem>
                  <SelectItem value="4-5">4-5 years</SelectItem>
                  <SelectItem value="6-10">6-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currentRole">Current Role *</Label>
              <Select value={profileData.currentRole} onValueChange={(value) => updateField("currentRole", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select current role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="junior">Junior/Entry Level</SelectItem>
                  <SelectItem value="mid-level">Mid-Level Professional</SelectItem>
                  <SelectItem value="senior">Senior Professional</SelectItem>
                  <SelectItem value="manager">Manager/Team Lead</SelectItem>
                  <SelectItem value="executive">Executive/Director</SelectItem>
                  <SelectItem value="entrepreneur">Entrepreneur/Founder</SelectItem>
                  <SelectItem value="job-seeking">Unemployed/Job Seeking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Industry and Startup Exposure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Select value={profileData.industry} onValueChange={(value) => updateField("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance/Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail/E-commerce</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="government">Government/Public Sector</SelectItem>
                  <SelectItem value="nonprofit">Non-Profit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startupExposure">Startup Exposure *</Label>
              <Select
                value={profileData.startupExposure}
                onValueChange={(value) => updateField("startupExposure", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select startup exposure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No exposure</SelectItem>
                  <SelectItem value="interested">Interested but no experience</SelectItem>
                  <SelectItem value="employee">Employee at startup</SelectItem>
                  <SelectItem value="founder">Co-founder/Founder</SelectItem>
                  <SelectItem value="multiple">Multiple startups experience</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Text Fields */}
          <div>
            <Label htmlFor="currentResponsibilities">Current Work Responsibilities * (Max 100 words)</Label>
            <Textarea
              id="currentResponsibilities"
              value={profileData.currentResponsibilities}
              onChange={(e) => updateField("currentResponsibilities", e.target.value)}
              placeholder="Briefly describe your current work responsibilities and key tasks..."
              rows={3}
              className="mt-1"
            />
            <div className="flex justify-between items-center mt-1">
              <span
                className={`text-xs ${getWordCount(profileData.currentResponsibilities) > 100 ? "text-red-600" : "text-gray-500"}`}
              >
                {getWordCount(profileData.currentResponsibilities)}/100 words
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="careerGoal">3-Year Career Goal * (Max 50 words)</Label>
            <Textarea
              id="careerGoal"
              value={profileData.careerGoal}
              onChange={(e) => updateField("careerGoal", e.target.value)}
              placeholder="What do you want to become in 3 years? Describe your career aspirations..."
              rows={2}
              className="mt-1"
            />
            <div className="flex justify-between items-center mt-1">
              <span
                className={`text-xs ${getWordCount(profileData.careerGoal) > 50 ? "text-red-600" : "text-gray-500"}`}
              >
                {getWordCount(profileData.careerGoal)}/50 words
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="biggestChallenge">Biggest Work Challenge This Year * (Max 50 words)</Label>
            <Textarea
              id="biggestChallenge"
              value={profileData.biggestChallenge}
              onChange={(e) => updateField("biggestChallenge", e.target.value)}
              placeholder="What is your biggest professional challenge or obstacle this year?"
              rows={2}
              className="mt-1"
            />
            <div className="flex justify-between items-center mt-1">
              <span
                className={`text-xs ${getWordCount(profileData.biggestChallenge) > 50 ? "text-red-600" : "text-gray-500"}`}
              >
                {getWordCount(profileData.biggestChallenge)}/50 words
              </span>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Save and Skip Buttons */}
          <div className="pt-4 space-y-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Complete Profile & Continue to Assessment
                </>
              )}
            </Button>

            {onSkip && (
              <Button
                onClick={onSkip}
                variant="outline"
                className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
              >
                Skip Profile Setup (Continue Without Personalization)
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg border">
            <p className="font-medium mb-1">📋 Why we need this information:</p>
            <ul className="space-y-1">
              <li>• Provide personalized career advice in reflection questions</li>
              <li>• Connect course concepts to your specific background</li>
              <li>• Offer relevant next steps for your career goals</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
