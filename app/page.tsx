"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { CVUpload } from "@/components/cv-upload"
import { SearchPanel } from "@/components/search-panel"
import { JobList } from "@/components/job-list"
import { StatsBar } from "@/components/stats-bar"
import { ApplyResultsDialog } from "@/components/apply-results-dialog"
import type { Job, CVProfile, SearchFilters } from "@/lib/types"

export default function HomePage() {
  const [cvProfile, setCvProfile] = useState<CVProfile | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [applicationStatuses, setApplicationStatuses] = useState<
    Record<string, "pending" | "sent" | "failed">
  >({})
  const [hasSearched, setHasSearched] = useState(false)
  const [applyProgress, setApplyProgress] = useState<{
    current: number
    total: number
    currentJob: string
  } | null>(null)
  const [applyResults, setApplyResults] = useState<{
    summary: {
      total: number
      successful: number
      failed: number
      applicant: string
    }
    results: {
      job_id: string
      job_title: string
      employer_name: string
      apply_link: string
      sent_to?: string
      status: "sent" | "failed"
      message: string
    }[]
  } | null>(null)

  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    employmentType: "all",
    datePosted: "all",
    page: 1,
  })

  // Derive search query from profile if empty
  const getSearchQuery = useCallback(() => {
    if (filters.query) return filters.query
    if (cvProfile?.jobTitle) return cvProfile.jobTitle
    if (cvProfile?.skills.length) return cvProfile.skills.slice(0, 3).join(", ")
    return "jobs"
  }, [filters.query, cvProfile])

  const searchJobs = useCallback(async () => {
    setIsLoading(true)
    setHasSearched(true)

    const query = getSearchQuery()
    const params = new URLSearchParams({
      query,
      page: filters.page.toString(),
      employment_type: filters.employmentType === "all" ? "" : filters.employmentType,
      date_posted: filters.datePosted,
    })

    try {
      const response = await fetch(`/api/jobs?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch jobs")
      }
      setJobs(data.data || [])
      if (data.data?.length) {
        toast.success(`Found ${data.data.length} jobs in UAE`)
      } else {
        toast.info("No jobs found. Try a different search.")
      }
    } catch (error) {
      console.error("[v0] Search failed:", error)
      toast.error("Failed to search jobs. Please try again.")
      setJobs([])
    } finally {
      setIsLoading(false)
    }
  }, [filters, getSearchQuery])

  const handleToggleSelect = (jobId: string) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const unappliedIds = jobs
      .filter((j) => applicationStatuses[j.job_id] !== "sent")
      .map((j) => j.job_id)
    setSelectedJobs(new Set(unappliedIds))
  }

  const handleDeselectAll = () => {
    setSelectedJobs(new Set())
  }

  const handleAutoApply = async () => {
    if (!cvProfile) {
      toast.error("Please set up your CV profile first.")
      return
    }

    if (selectedJobs.size === 0) {
      toast.error("Please select jobs to apply to.")
      return
    }

    setIsApplying(true)
    const selectedJobData = jobs.filter((j) => selectedJobs.has(j.job_id))

    // Mark all as pending
    const pendingStatuses: Record<string, "pending"> = {}
    selectedJobs.forEach((id) => {
      pendingStatuses[id] = "pending"
    })
    setApplicationStatuses((prev) => ({ ...prev, ...pendingStatuses }))

    // Show progress
    setApplyProgress({
      current: 0,
      total: selectedJobData.length,
      currentJob: selectedJobData[0]?.job_title || "",
    })

    // Process jobs one by one with a small delay for visual feedback
    const allResults: {
      job_id: string
      job_title: string
      employer_name: string
      apply_link: string
      sent_to?: string
      status: "sent" | "failed"
      message: string
    }[] = []

    for (let i = 0; i < selectedJobData.length; i++) {
      const job = selectedJobData[i]

      setApplyProgress({
        current: i + 1,
        total: selectedJobData.length,
        currentJob: job.job_title,
      })

      try {
        const response = await fetch("/api/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobs: [job],
            cvProfile,
          }),
        })

        if (!response.ok) throw new Error("Apply failed")

        const data = await response.json()
        const result = data.results[0]
        allResults.push(result)

        // Update this job's status immediately
        setApplicationStatuses((prev) => ({
          ...prev,
          [result.job_id]: result.status,
        }))
      } catch {
        allResults.push({
          job_id: job.job_id,
          job_title: job.job_title,
          employer_name: job.employer_name,
          apply_link: job.job_apply_link,
          sent_to: undefined,
          status: "failed",
          message: `Failed to send email for ${job.job_title}`,
        })
        setApplicationStatuses((prev) => ({
          ...prev,
          [job.job_id]: "failed",
        }))
      }

      // Small delay between applications for visual feedback
      if (i < selectedJobData.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600))
      }
    }

    const successful = allResults.filter((r) => r.status === "sent").length
    const failed = allResults.filter((r) => r.status === "failed").length

    setApplyResults({
      summary: {
        total: allResults.length,
        successful,
        failed,
        applicant: cvProfile.name,
      },
      results: allResults,
    })
    setSelectedJobs(new Set())
    setApplyProgress(null)

    toast.success(
      `${successful} of ${allResults.length} applications sent successfully!`
    )

    setIsApplying(false)
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
    setSelectedJobs(new Set())
  }

  // Stats
  const totalApplied = Object.values(applicationStatuses).filter(
    (s) => s === "sent" || s === "failed"
  ).length
  const totalSuccess = Object.values(applicationStatuses).filter(
    (s) => s === "sent"
  ).length
  const totalFailed = Object.values(applicationStatuses).filter(
    (s) => s === "failed"
  ).length

  return (
    <div className="min-h-screen bg-background">
      <Header applicationCount={totalSuccess} />

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="space-y-6">
          {/* Hero section */}
          <div className="text-center">
            <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Find and Apply to UAE Jobs Automatically
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
              Upload your CV, search for matching positions across the UAE, and
              send applications to multiple employers with a single click.
            </p>
          </div>

          {/* Stats */}
          <StatsBar
            totalJobs={jobs.length}
            totalApplied={totalApplied}
            totalSuccess={totalSuccess}
            totalFailed={totalFailed}
          />

          {/* Two column layout */}
          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            {/* Left: CV Upload */}
            <div className="space-y-4">
              <CVUpload
                profile={cvProfile}
                onProfileChange={(profile) => {
                  setCvProfile(profile)
                  toast.success("CV profile saved!")
                  // Auto-set search query from job title
                  if (profile.jobTitle && !filters.query) {
                    setFilters((prev) => ({
                      ...prev,
                      query: profile.jobTitle,
                    }))
                  }
                }}
              />
              {cvProfile && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-sm font-medium text-foreground">
                    How it works
                  </h3>
                  <ol className="mt-2 space-y-2 text-xs text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                        1
                      </span>
                      Search for matching jobs using your target role
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                        2
                      </span>
                      Select the jobs you want to apply to
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                        3
                      </span>
                      Click Auto Apply to send your CV to all selected jobs
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                        4
                      </span>
                      Track results in the summary dashboard
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Right: Search + Results */}
            <div className="space-y-4">
              <SearchPanel
                filters={filters}
                onFiltersChange={setFilters}
                onSearch={searchJobs}
                isLoading={isLoading}
                disabled={!cvProfile}
              />
              <JobList
                jobs={jobs}
                isLoading={isLoading}
                selectedJobs={selectedJobs}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onAutoApply={handleAutoApply}
                isApplying={isApplying}
                applyProgress={applyProgress}
                applicationStatuses={applicationStatuses}
                page={filters.page}
                onPageChange={handlePageChange}
                hasSearched={hasSearched}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Results dialog */}
      <ApplyResultsDialog
        results={applyResults}
        onClose={() => setApplyResults(null)}
      />
    </div>
  )
}
