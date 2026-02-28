"use client"

import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SearchFilters } from "@/lib/types"

interface SearchPanelProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onSearch: () => void
  isLoading: boolean
  disabled: boolean
}

export function SearchPanel({
  filters,
  onFiltersChange,
  onSearch,
  isLoading,
  disabled,
}: SearchPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs... e.g. React Developer, Data Analyst"
            className="pl-9"
            value={filters.query}
            onChange={(e) =>
              onFiltersChange({ ...filters, query: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch()
            }}
            disabled={disabled}
          />
        </div>
        <Button onClick={onSearch} disabled={isLoading || disabled}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Searching
            </span>
          ) : (
            <>
              <Search className="mr-1.5 h-4 w-4" />
              Search UAE Jobs
            </>
          )}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters:
        </div>
        <Select
          value={filters.employmentType}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, employmentType: value })
          }
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="FULLTIME">Full-time</SelectItem>
            <SelectItem value="PARTTIME">Part-time</SelectItem>
            <SelectItem value="CONTRACTOR">Contract</SelectItem>
            <SelectItem value="INTERN">Internship</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.datePosted}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, datePosted: value })
          }
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Date Posted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="3days">Last 3 Days</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
