"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, X, User, Mail, Phone, Tag, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { CVProfile } from "@/lib/types"

interface CVUploadProps {
  profile: CVProfile | null
  onProfileChange: (profile: CVProfile) => void
}

export function CVUpload({ profile, onProfileChange }: CVUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(!profile)
  const [isParsing, setIsParsing] = useState(false)
  const [skillInput, setSkillInput] = useState("")
  const [formData, setFormData] = useState<CVProfile>(
    profile || {
      name: "",
      email: "",
      phone: "",
      skills: [],
      jobTitle: "",
      experience: "",
      summary: "",
    }
  )

  const parseCV = useCallback(async (file: File) => {
    setIsParsing(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("/api/parse-cv", {
        method: "POST",
        body: formDataUpload,
      })

      if (!response.ok) {
        throw new Error("Failed to parse CV")
      }

      const result = await response.json()

      if (result.success && result.data) {
        const parsed = result.data
        setFormData({
          name: parsed.name || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          skills: parsed.skills || [],
          jobTitle: parsed.jobTitle || "",
          experience: parsed.experience || "",
          summary: parsed.summary || "",
        })
        toast.success("CV parsed successfully! Fields have been auto-filled.")
      }
    } catch (error) {
      console.error("CV parse error:", error)
      toast.error("Could not auto-fill from CV. Please fill in manually.")
    } finally {
      setIsParsing(false)
    }
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      if (file && (file.type === "application/pdf" || file.name.endsWith(".pdf"))) {
        setFileName(file.name)
        // Store file as base64 for email attachment
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1]
          setFileBase64(base64)
        }
        reader.readAsDataURL(file)
        parseCV(file)
      } else {
        toast.error("Please upload a PDF file.")
      }
    },
    [parseCV]
  )

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }))
      setSkillInput("")
    }
  }

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const handleSave = () => {
    if (formData.name && formData.email && formData.jobTitle) {
      onProfileChange({
        ...formData,
        cvFileBase64: fileBase64 || undefined,
        cvFileName: fileName || undefined,
      })
      setIsEditing(false)
    }
  }

  if (profile && !isEditing) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <CardTitle className="text-base">CV Profile Ready</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-muted-foreground"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{profile.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{profile.jobTitle}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.phone}</span>
              </div>
            )}
          </div>
          {profile.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload Your CV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* File Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="relative flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border px-6 py-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          {isParsing ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Extracting CV information...
              </p>
              <p className="text-xs text-muted-foreground">
                Auto-filling your profile from the uploaded PDF
              </p>
            </>
          ) : fileName ? (
            <>
              <FileText className="h-8 w-8 text-primary" />
              <p className="text-sm font-medium text-foreground">{fileName}</p>
              <p className="text-xs text-success">Fields auto-filled from CV</p>
              <button
                onClick={() => {
                  setFileName(null)
                  setFileBase64(null)
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    skills: [],
                    jobTitle: "",
                    experience: "",
                    summary: "",
                  })
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Remove and clear
              </button>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drop your CV here or{" "}
                  <label className="cursor-pointer text-primary underline underline-offset-2">
                    browse
                    <input
                      type="file"
                      accept=".pdf"
                      className="sr-only"
                      onChange={handleFileSelect}
                    />
                  </label>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF up to 10MB -- auto-fills your profile
                </p>
              </div>
            </>
          )}
        </div>

        {/* Profile Form */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isParsing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              disabled={isParsing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+971 50 123 4567"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              disabled={isParsing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Target Job Title *</Label>
            <Input
              id="jobTitle"
              placeholder="Frontend Developer"
              value={formData.jobTitle}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
              }
              disabled={isParsing}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Years of Experience</Label>
          <Input
            id="experience"
            placeholder="e.g., 5 years"
            value={formData.experience}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, experience: e.target.value }))
            }
            disabled={isParsing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea
            id="summary"
            placeholder="Brief summary of your professional background..."
            rows={3}
            value={formData.summary}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, summary: e.target.value }))
            }
            disabled={isParsing}
          />
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <Label>Skills</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g., React, Python)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addSkill()
                }
              }}
              disabled={isParsing}
            />
            <Button type="button" variant="secondary" onClick={addSkill} disabled={isParsing}>
              <Tag className="mr-1.5 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          {formData.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {formData.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="gap-1 pr-1.5 text-xs"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {skill}</span>
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={!formData.name || !formData.email || !formData.jobTitle || isParsing}
          className="w-full"
        >
          {isParsing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing CV...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  )
}
