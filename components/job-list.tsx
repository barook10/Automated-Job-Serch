"use client"

import {
  Send,
  CheckSquare,
  Square,
  Briefcase,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { JobCard } from "@/components/job-card"
import type { Job } from "@/lib/types"

interface JobListProps {
  jobs: Job[]
  isLoading: boolean
  selectedJobs: Set<string>
  onToggleSelect: (jobId: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onAutoApply: () => void
  isApplying: boolean
  applyProgress: {
    current: number
    total: number
    currentJob: string
  } | null
  applicationStatuses: Record<string, "pending" | "sent" | "failed">
  page: number
  onPageChange: (page: number) => void
  hasSearched: boolean
}

export function JobList({
  jobs,
  isLoading,
  selectedJobs,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onAutoApply,
  isApplying,
  applyProgress,
  applicationStatuses,
  page,
  onPageChange,
  hasSearched,
}: JobListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-medium text-foreground">
          Ready to find your next role?
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Set up your CV profile above, then search for jobs across the UAE.
          Select matches and auto-apply with one click.
        </p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-medium text-foreground">
          No jobs found
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try adjusting your search query or filters to find more opportunities.
        </p>
      </div>
    )
  }

  const unappliedJobs = jobs.filter(
    (j) => applicationStatuses[j.job_id] !== "sent"
  )
  const allUnappliedSelected =
    unappliedJobs.length > 0 &&
    unappliedJobs.every((j) => selectedJobs.has(j.job_id))

  return (
    <div className="space-y-3">
      {/* Action bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={allUnappliedSelected ? onDeselectAll : onSelectAll}
              disabled={isApplying}
            >
              {allUnappliedSelected ? (
                <>
                  <CheckSquare className="h-3.5 w-3.5" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5" />
                  Select All
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              {selectedJobs.size} of {jobs.length} selected
            </span>
          </div>
          <Button
            size="sm"
            onClick={onAutoApply}
            disabled={selectedJobs.size === 0 || isApplying}
            className="gap-1.5"
          >
            {isApplying ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Sending CV...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Auto Apply ({selectedJobs.size})
              </>
            )}
          </Button>
        </div>

        {/* Progress bar */}
        {isApplying && applyProgress && (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.03] px-4 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                Sending CV to employers...
              </span>
              <span className="text-muted-foreground">
                {applyProgress.current} / {applyProgress.total}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${(applyProgress.current / applyProgress.total) * 100}%`,
                }}
              />
            </div>
            <p className="mt-1.5 truncate text-xs text-muted-foreground">
              Applying to: {applyProgress.currentJob}
            </p>
          </div>
        )}
      </div>

      {/* Job cards */}
      {jobs.map((job) => (
        <JobCard
          key={job.job_id}
          job={job}
          isSelected={selectedJobs.has(job.job_id)}
          onToggleSelect={onToggleSelect}
          applicationStatus={applicationStatuses[job.job_id] || null}
        />
      ))}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Previous
        </Button>
        <span className="px-3 text-sm text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={jobs.length < 10}
        >
          Next
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
