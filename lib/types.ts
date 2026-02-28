export interface Job {
  job_id: string
  employer_name: string
  employer_logo: string | null
  employer_website: string | null
  job_employment_type: string
  job_title: string
  job_apply_link: string
  job_description: string
  job_city: string
  job_state: string
  job_country: string
  job_posted_at_datetime_utc: string
  job_min_salary: number | null
  job_max_salary: number | null
  job_salary_currency: string | null
  job_salary_period: string | null
  job_highlights?: {
    Qualifications?: string[]
    Responsibilities?: string[]
    Benefits?: string[]
  }
  job_required_skills?: string[] | null
}

export interface CVProfile {
  name: string
  email: string
  phone: string
  skills: string[]
  jobTitle: string
  experience: string
  summary: string
  cvFileBase64?: string
  cvFileName?: string
}

export interface ApplicationRecord {
  id: string
  job: Job
  status: "pending" | "sent" | "failed"
  appliedAt: string
}

export interface SearchFilters {
  query: string
  employmentType: string
  datePosted: string
  page: number
}
