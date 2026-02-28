import { NextResponse } from "next/server"
import pdf from "pdf-parse"

interface ParsedCV {
  name: string
  email: string
  phone: string
  skills: string[]
  jobTitle: string
  experience: string
  summary: string
}

const KNOWN_SKILLS = [
  "React", "TypeScript", "JavaScript", "Node.js", "NodeJs", "Python", "Java",
  "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "Ruby", "PHP", "SQL", "MySQL",
  "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure",
  "GCP", "Firebase", "Git", "GraphQL", "REST", "HTML", "CSS", "SASS", "LESS",
  "Tailwind", "Bootstrap", "Material UI", "Next.js", "Vue.js", "Angular",
  "Svelte", "Express", "Django", "Flask", "Spring", "Laravel", "Rails",
  "Flutter", "React Native", "TDD", "CI/CD", "Agile", "Scrum", "Figma",
  "Photoshop", "Machine Learning", "AI", "Data Science", "DevOps",
  "Microservices", "REST API", "ESS", "jQuery", "Yelp API", "Spotify API",
  "OAuth", "EmailJS", "Front-end", "Back-end", "Full-stack",
  "Agile software development", "Test driven development",
  "Code structure and architecture", "Front-end and back-end web",
]

const JOB_TITLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "Web Developer", "Mobile Developer",
  "Data Scientist", "Data Engineer", "DevOps Engineer", "Cloud Engineer",
  "Machine Learning Engineer", "QA Engineer", "Product Manager",
  "UX Designer", "UI Designer", "Technical Support", "System Administrator",
  "Database Administrator", "Network Engineer", "Security Engineer",
  "Solutions Architect", "Technical Lead", "Engineering Manager",
  "Junior Web Developer", "Senior Developer", "Technical Support Assistant",
]

function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = text.match(emailRegex)
  return matches?.[0] || ""
}

function extractPhone(text: string): string {
  // Match various phone formats including UAE numbers
  const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g
  const matches = text.match(phoneRegex)
  if (!matches) return ""
  // Return the first match that looks like a real phone number (at least 7 digits)
  for (const match of matches) {
    const digits = match.replace(/\D/g, "")
    if (digits.length >= 7 && digits.length <= 15) {
      return match.trim()
    }
  }
  return ""
}

function extractName(text: string): string {
  // Typically the name is one of the first lines in a CV
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  
  // Try combining first two lines if they look like name parts (short, no special chars)
  const nameParts: string[] = []
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]
    // Skip lines that look like job titles, emails, phones, or addresses
    if (line.includes("@") || /\d{5,}/.test(line) || line.length > 40) continue
    // Check if the line is a simple name-like string (1-3 words, mostly letters)
    if (/^[A-Za-z\s'-]{2,30}$/.test(line) && line.split(/\s+/).length <= 4) {
      nameParts.push(line)
      if (nameParts.join(" ").split(/\s+/).length >= 2) break
    }
  }
  
  if (nameParts.length > 0) {
    return nameParts.join(" ").replace(/\s+/g, " ").trim()
  }
  return ""
}

function extractSkills(text: string): string[] {
  const found: string[] = []
  const textLower = text.toLowerCase()
  
  for (const skill of KNOWN_SKILLS) {
    if (textLower.includes(skill.toLowerCase()) && !found.includes(skill)) {
      // Normalize NodeJs -> Node.js etc
      const normalized = skill === "NodeJs" ? "Node.js" : skill
      if (!found.includes(normalized)) {
        found.push(normalized)
      }
    }
  }
  
  return found.slice(0, 20) // Cap at 20 skills
}

function extractJobTitle(text: string): string {
  const textLower = text.toLowerCase()
  
  // Check the first few lines for a job title
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    for (const title of JOB_TITLES) {
      if (lines[i].toLowerCase().includes(title.toLowerCase())) {
        return title
      }
    }
  }
  
  // Fallback: check entire text
  for (const title of JOB_TITLES) {
    if (textLower.includes(title.toLowerCase())) {
      return title
    }
  }
  
  return ""
}

function extractExperience(text: string): string {
  // Look for patterns like "X years" or date ranges
  const yearsRegex = /(\d+)\+?\s*years?\s*(of\s*)?experience/i
  const match = text.match(yearsRegex)
  if (match) return `${match[1]} years`
  
  // Try to count employment entries
  const employmentSection = text.match(/employment\s*history([\s\S]*?)(?:education|certif|project|$)/i)
  if (employmentSection) {
    const entries = employmentSection[1].match(/(?:developer|engineer|assistant|manager|lead|designer|analyst)/gi)
    if (entries && entries.length > 0) {
      return `${entries.length}+ roles`
    }
  }
  
  return ""
}

function extractSummary(text: string): string {
  // Look for a summary/profile/about section
  const summaryRegex = /(?:summary|profile|about|objective)\s*\n+([\s\S]*?)(?:\n\s*\n|employment|experience|education|skills)/i
  const match = text.match(summaryRegex)
  if (match) {
    const summary = match[1].trim().replace(/\s+/g, " ")
    return summary.length > 300 ? summary.substring(0, 300) + "..." : summary
  }
  return ""
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfData = await pdf(buffer)
    const text = pdfData.text

    const parsed: ParsedCV = {
      name: extractName(text),
      email: extractEmail(text),
      phone: extractPhone(text),
      skills: extractSkills(text),
      jobTitle: extractJobTitle(text),
      experience: extractExperience(text),
      summary: extractSummary(text),
    }

    return NextResponse.json({ success: true, data: parsed, rawTextPreview: text.substring(0, 500) })
  } catch (error) {
    console.error("CV parse error:", error)
    return NextResponse.json(
      { error: "Failed to parse CV. Please ensure the file is a valid PDF." },
      { status: 500 }
    )
  }
}
