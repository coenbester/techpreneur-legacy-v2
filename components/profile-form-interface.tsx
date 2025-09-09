"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getStudents, getStudentProfile, saveStudentProfile } from "@/lib/supabase"
import { Plus, X, Save, User, Briefcase, GraduationCap, Target, Lightbulb } from "lucide-react"

interface Student {
  id: string
  name: string
  student_number: string
  email: string
}

interface ProfileData {
  student_id: string
  current_role: string
  company_type: string
  industry_experience: string
  education_background: string
  years_experience: number
  previous_startups: string
  entrepreneurial_experience: string
  key_skills: string[]
  technology_interests: string
  career_goals: string
  learning_objectives: string
  full_profile_text: string
}

export default function ProfileFormInterface() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSkill, setNewSkill] = useState("")

  const [profileData, setProfileData] = useState<ProfileData>({
    student_id: "",
    current_role: "",
    company_type: "",
    industry_experience: "",
    education_background: "",
    years_experience: 0,
    previous_startups: "",
    entrepreneurial_experience: "",
    key_skills: [],
    technology_interests: "",
    career_goals: "",
    learning_objectives: "",
    full_profile_text: "",
  })

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentProfile(selectedStudentId)
    }
  }, [selectedStudentId])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const result = await getStudents()
      if (result.success && result.data) {
        setStudents(result.data)
      }
    } catch (error) {
      console.error("Failed to load students:", error)
    }
    setLoading(false)
  }

  const loadStudentProfile = async (studentId: string) => {
    setLoading(true)
    try {
      const result = await getStudentProfile(studentId)
      if (result.success && result.data) {
        // Profile exists, load it
        const profile = result.data
        setProfileData({
          student_id: studentId,
          current_role: profile.current_role || "",
          company_type: profile.company_type || "",
          industry_experience: profile.industry_experience || "",
          education_background: profile.education_background || "",
          years_experience: profile.years_experience || 0,
          previous_startups: profile.previous_startups || "",
          entrepreneurial_experience: profile.entrepreneurial_experience || "",
          key_skills: profile.key_skills || [],
          technology_interests: profile.technology_interests || "",
          career_goals: profile.career_goals || "",
          learning_objectives: profile.learning_objectives || "",
          full_profile_text: profile.full_profile_text || "",
        })
      } else {
        // No profile exists, reset form for new profile
        setProfileData({
          student_id: studentId,
          current_role: "",
          company_type: "",
          industry_experience: "",
          education_background: "",
          years_experience: 0,
          previous_startups: "",
          entrepreneurial_experience: "",
          key_skills: [],
          technology_interests: "",
          career_goals: "",
          learning_objectives: "",
          full_profile_text: "",
        })
      }
    } catch (error) {
      console.error("Failed to load student profile:", error)
    }
    setLoading(false)
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.key_skills.includes(newSkill.trim())) {
      setProfileData((prev) => ({
        ...prev,
        key_skills: [...prev.key_skills, newSkill.trim()],
      }))
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileData((prev) => ({
      ...prev,
      key_skills: prev.key_skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const handleSave = async () => {
    if (!selectedStudentId) {
      alert("Please select a student first")
      return
    }

    setSaving(true)
    try {
      console.log("💾 Saving profile for student:", selectedStudentId)
      console.log("📊 Profile data:", profileData)

      const result = await saveStudentProfile(selectedStudentId, profileData)
      console.log("✅ Save result:", result)

      alert("Profile saved successfully!")

      // Refresh the profiles list
      await loadStudents()
    } catch (error) {
      console.error("❌ Save error:", error)
      alert(`Failed to save profile: ${error.message || "Unknown error"}`)
    }
    setSaving(false)
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Profile Management
          </CardTitle>
          <CardDescription>
            Create or update detailed student profiles for personalized learning experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-select">Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student to create/edit profile" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.student_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium">{selectedStudent.name}</p>
                <p className="text-sm text-gray-600">{selectedStudent.student_number}</p>
                <p className="text-sm text-gray-600">{selectedStudent.email}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedStudentId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current-role">Current Role/Position</Label>
                <Input
                  id="current-role"
                  value={profileData.current_role}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, current_role: e.target.value }))}
                  placeholder="e.g., Software Engineer, Student, Manager"
                />
              </div>

              <div>
                <Label htmlFor="company-type">Company/Organization Type</Label>
                <Select
                  value={profileData.company_type}
                  onValueChange={(value) => setProfileData((prev) => ({ ...prev, company_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="small-business">Small Business</SelectItem>
                    <SelectItem value="medium-enterprise">Medium Enterprise</SelectItem>
                    <SelectItem value="large-corporation">Large Corporation</SelectItem>
                    <SelectItem value="non-profit">Non-Profit</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="freelance">Freelance/Self-Employed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="industry">Industry Experience</Label>
                <Input
                  id="industry"
                  value={profileData.industry_experience}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, industry_experience: e.target.value }))}
                  placeholder="e.g., Technology, Healthcare, Finance, Education"
                />
              </div>

              <div>
                <Label htmlFor="years-experience">Years of Professional Experience</Label>
                <Input
                  id="years-experience"
                  type="number"
                  min="0"
                  value={profileData.years_experience}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, years_experience: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Educational Background */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Educational Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="education">Education Background</Label>
                <Textarea
                  id="education"
                  value={profileData.education_background}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, education_background: e.target.value }))}
                  placeholder="e.g., Bachelor's in Computer Science, MBA, High School Diploma"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tech-interests">Technology Interests</Label>
                <Textarea
                  id="tech-interests"
                  value={profileData.technology_interests}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, technology_interests: e.target.value }))}
                  placeholder="e.g., AI/ML, Web Development, Mobile Apps, Blockchain"
                  rows={3}
                />
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
              <div>
                <Label htmlFor="previous-startups">Previous Startups/Ventures</Label>
                <Textarea
                  id="previous-startups"
                  value={profileData.previous_startups}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, previous_startups: e.target.value }))}
                  placeholder="Describe any previous entrepreneurial ventures, side projects, or business ideas"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="entrepreneurial-experience">Entrepreneurial Experience</Label>
                <Textarea
                  id="entrepreneurial-experience"
                  value={profileData.entrepreneurial_experience}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, entrepreneurial_experience: e.target.value }))}
                  placeholder="Describe your experience with starting businesses, innovation, leadership roles"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Goals and Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals & Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="career-goals">Career Goals</Label>
                <Textarea
                  id="career-goals"
                  value={profileData.career_goals}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, career_goals: e.target.value }))}
                  placeholder="What are your short-term and long-term career aspirations?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="learning-objectives">Learning Objectives</Label>
                <Textarea
                  id="learning-objectives"
                  value={profileData.learning_objectives}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, learning_objectives: e.target.value }))}
                  placeholder="What specific skills or knowledge do you want to gain from this course?"
                  rows={3}
                />
              </div>

              <div>
                <Label>Key Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                  />
                  <Button onClick={handleAddSkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.key_skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveSkill(skill)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedStudentId && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="full-profile">Full Profile Text (Optional)</Label>
              <Textarea
                id="full-profile"
                value={profileData.full_profile_text}
                onChange={(e) => setProfileData((prev) => ({ ...prev, full_profile_text: e.target.value }))}
                placeholder="Any additional information about the student's background, interests, or goals"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedStudentId && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      )}
    </div>
  )
}
