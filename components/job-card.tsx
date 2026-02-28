"use client"

import { useState } from "react"
import {
  MapPin,
  Clock,
  Building2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Briefcase,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Job } from "@/lib/types"

interface JobCardProps {
  job: Job
  isSelected: boolean
  onToggleSelect: (jobId: string) => void
  applicationStatus?: "pending" | "sent" | "failed" | null
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return date.toLocaleDateString("en-AE", { month: "short", day: "numeric" })
}

function formatSalary(min: number | null, max: number | null, currency: string | null, period: string | null) {
  if (!min && !max) return null
  const curr = currency || "AED"
  const per = period ? `/${period.toLowerCase()}` : ""
  if (min && max) return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}${per}`
  if (min) return `From ${curr} ${min.toLocaleString()}${per}`
  return `Up to ${curr} ${max!.toLocaleString()}${per}`
}

function getEmploymentBadgeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "FULLTIME":
      return "default"
    case "PARTTIME":
      return "secondary"
    case "CONTRACTOR":
      return "outline"
    default:
      return "secondary"
  }
}

export function JobCard({ job, isSelected, onToggleSelect, applicationStatus }: JobCardProps) {
  const [expanded, setExpanded] = useState(false)

  const salary = formatSalary(
    job.job_min_salary,
    job.job_max_salary,
    job.job_salary_currency,
    job.job_salary_period
  )

  return (
    <Card
      className={`transition-all ${
        isSelected
          ? "border-primary/40 bg-primary/[0.02] ring-1 ring-primary/20"
          : "hover:border-border/80"
      } ${applicationStatus === "sent" ? "border-success/30 bg-success/[0.02]" : ""} ${
        applicationStatus === "failed" ? "border-destructive/30 bg-destructive/[0.02]" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Select checkbox */}
          <div className="flex pt-0.5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(job.job_id)}
              disabled={applicationStatus === "sent"}
              aria-label={`Select ${job.job_title}`}
            />
          </div>

          {/* Logo */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {job.employer_logo ? (
              <img
                src={job.employer_logo}
                alt={`${job.employer_name} logo`}
                className="h-full w-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                  ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden")
                }}
              />
            ) : null}
            <Building2
              className={`h-5 w-5 text-muted-foreground ${job.employer_logo ? "hidden" : ""}`}
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {job.job_title}
                </h3>
                <p className="truncate text-sm text-muted-foreground">
                  {job.employer_name}
                </p>
              </div>

              {/* Status indicator */}
              {applicationStatus === "sent" && (
                <Badge className="shrink-0 gap-1 bg-success text-success-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  Applied
                </Badge>
              )}
              {applicationStatus === "failed" && (
                <Badge variant="destructive" className="shrink-0 gap-1">
                  <XCircle className="h-3 w-3" />
                  Failed
                </Badge>
              )}
              {applicationStatus === "pending" && (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />
                  Pending
                </Badge>
              )}
            </div>

            {/* Meta info */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {(job.job_city || job.job_state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[job.job_city, job.job_state].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(job.job_posted_at_datetime_utc)}
              </span>
              {salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {salary}
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge
                variant={getEmploymentBadgeVariant(job.job_employment_type)}
                className="text-[10px] leading-tight"
              >
                <Briefcase className="mr-1 h-2.5 w-2.5" />
                {job.job_employment_type?.replace("FULLTIME", "Full-time")
                  .replace("PARTTIME", "Part-time")
                  .replace("CONTRACTOR", "Contract")
                  .replace("INTERN", "Internship") || "N/A"}
              </Badge>
              {job.job_required_skills?.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-[10px] leading-tight">
                  {skill}
                </Badge>
              ))}
            </div>

            {/* Expandable description */}
            {expanded && (
              <div className="mt-3 space-y-2 rounded-lg bg-muted/50 p-3">
                <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                  {job.job_description?.slice(0, 800)}
                  {job.job_description?.length > 800 && "..."}
                </p>
                {job.job_highlights?.Qualifications && (
                  <div>
                    <p className="text-xs font-medium text-foreground">Qualifications:</p>
                    <ul className="mt-1 space-y-0.5">
                      {job.job_highlights.Qualifications.slice(0, 5).map((q, i) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          {"- "}{q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" />
                    Details
                  </>
                )}
              </Button>
              <a
                href={job.job_apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-primary hover:bg-primary/5 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Apply Direct
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
