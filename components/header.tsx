"use client"

import { Briefcase, Send } from "lucide-react"

export function Header({
  applicationCount,
}: {
  applicationCount: number
}) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              AutoApply UAE
            </h1>
            <p className="text-xs text-muted-foreground">
              Automated Job Applications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {applicationCount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5">
              <Send className="h-3.5 w-3.5 text-success" />
              <span className="text-sm font-medium text-success">
                {applicationCount} Applied
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
