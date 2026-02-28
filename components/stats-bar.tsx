"use client"

import { Briefcase, Send, CheckCircle2, XCircle } from "lucide-react"

interface StatsBarProps {
  totalJobs: number
  totalApplied: number
  totalSuccess: number
  totalFailed: number
}

export function StatsBar({
  totalJobs,
  totalApplied,
  totalSuccess,
  totalFailed,
}: StatsBarProps) {
  const stats = [
    {
      label: "Jobs Found",
      value: totalJobs,
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Applied",
      value: totalApplied,
      icon: Send,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      label: "Successful",
      value: totalSuccess,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Failed",
      value: totalFailed,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
          >
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight text-foreground">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
