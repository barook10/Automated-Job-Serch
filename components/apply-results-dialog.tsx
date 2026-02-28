"use client"

import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ApplyResult {
  job_id: string
  job_title: string
  employer_name: string
  apply_link: string
  sent_to?: string
  status: "sent" | "failed"
  message: string
}

interface ApplyResultsDialogProps {
  results: {
    summary: {
      total: number
      successful: number
      failed: number
      applicant: string
    }
    results: ApplyResult[]
  } | null
  onClose: () => void
}

export function ApplyResultsDialog({
  results,
  onClose,
}: ApplyResultsDialogProps) {
  if (!results) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Application Results
            </h2>
            <p className="text-xs text-muted-foreground">
              {results.summary.successful} of {results.summary.total} applications
              sent successfully
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Summary */}
        <div className="flex gap-3 border-b border-border px-5 py-3">
          <div className="flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-sm font-medium text-success">
              {results.summary.successful} Sent
            </span>
          </div>
          {results.summary.failed > 0 && (
            <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {results.summary.failed} Failed
              </span>
            </div>
          )}
        </div>

        {/* Results list */}
        <ScrollArea className="max-h-[50vh]">
          <div className="divide-y divide-border">
            {results.results.map((result) => (
              <div key={result.job_id} className="flex items-center gap-3 px-5 py-3">
                {result.status === "sent" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {result.job_title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {result.employer_name}
                    {result.sent_to && (
                      <span className="ml-1 text-primary/70">
                        {"-> "}{result.sent_to}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={result.status === "sent" ? "secondary" : "destructive"}
                    className="text-[10px]"
                  >
                    {result.status === "sent" ? "Sent" : "Failed"}
                  </Badge>
                  <a
                    href={result.apply_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="sr-only">Open application link for {result.job_title}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <p className="mb-3 text-xs text-muted-foreground">
            Your CV has been emailed to {results.summary.successful} employer{results.summary.successful !== 1 ? "s" : ""} via Resend. 
            Each email includes your CV as a PDF attachment. Click the link icon to visit the employer portal directly.
          </p>
          <Button onClick={onClose} className="w-full" size="sm">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
