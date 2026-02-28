import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Resend client will be created on demand inside request handler to avoid
// build-time evaluation (which fails if the API key is missing during
// build).

// Try to extract a plausible HR/careers email from employer info
function deriveEmployerEmail(employerName: string, employerWebsite: string | null): string | null {
  // Clean up the website to get the domain
  if (employerWebsite) {
    try {
      const url = new URL(employerWebsite.startsWith("http") ? employerWebsite : `https://${employerWebsite}`)
      const domain = url.hostname.replace("www.", "")
      // Common HR/careers email patterns
      return `careers@${domain}`
    } catch {
      // Fall through
    }
  }

  // Try to construct domain from employer name
  const cleanName = employerName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
  if (cleanName.length > 2) {
    return `careers@${cleanName}.com`
  }

  return null
}

function buildEmailHtml(cvProfile: {
  name: string
  email: string
  phone: string
  skills: string[]
  jobTitle: string
  experience: string
  summary: string
}, jobTitle: string, employerName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <h2 style="color: #3b6cf5; margin-bottom: 4px;">Job Application: ${jobTitle}</h2>
      <p style="color: #666; margin-top: 0;">via AutoApply UAE</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      
      <p>Dear Hiring Team at <strong>${employerName}</strong>,</p>
      
      <p>I am writing to express my strong interest in the <strong>${jobTitle}</strong> position. 
      Please find my CV attached for your review.</p>
      
      ${cvProfile.summary ? `<p><strong>Professional Summary:</strong><br/>${cvProfile.summary}</p>` : ""}
      
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; font-weight: bold; width: 140px;">Full Name</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${cvProfile.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; font-weight: bold;">Email</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${cvProfile.email}</td>
        </tr>
        ${cvProfile.phone ? `<tr>
          <td style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; font-weight: bold;">Phone</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${cvProfile.phone}</td>
        </tr>` : ""}
        ${cvProfile.experience ? `<tr>
          <td style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; font-weight: bold;">Experience</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${cvProfile.experience}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; font-weight: bold;">Target Role</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${cvProfile.jobTitle}</td>
        </tr>
      </table>
      
      ${cvProfile.skills.length > 0 ? `
        <p><strong>Key Skills:</strong></p>
        <p>${cvProfile.skills.map(s => `<span style="display: inline-block; background: #eef2ff; color: #3b6cf5; padding: 4px 10px; border-radius: 12px; margin: 2px 4px 2px 0; font-size: 13px;">${s}</span>`).join("")}</p>
      ` : ""}
      
      <p>I look forward to hearing from you regarding this opportunity. 
      I am available for an interview at your earliest convenience.</p>
      
      <p>Best regards,<br/><strong>${cvProfile.name}</strong><br/>
      ${cvProfile.email}${cvProfile.phone ? `<br/>${cvProfile.phone}` : ""}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 11px; color: #999;">
        This application was sent via AutoApply UAE - Automated Job Application Platform
      </p>
    </div>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobs, cvProfile } = body

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: "No jobs provided" }, { status: 400 })
    }

    if (!cvProfile) {
      return NextResponse.json({ error: "CV profile not provided" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const results = []

    for (const job of jobs) {
      const employerEmail = deriveEmployerEmail(job.employer_name, job.employer_website || null)

      // Build attachments array
      const attachments: { filename: string; content: Buffer }[] = []
      if (cvProfile.cvFileBase64) {
        attachments.push({
          filename: cvProfile.cvFileName || `${cvProfile.name.replace(/\s+/g, "_")}_CV.pdf`,
          content: Buffer.from(cvProfile.cvFileBase64, "base64"),
        })
      }

      try {
        // Send the actual email via Resend
        const { data, error } = await resend.emails.send({
          from: "AutoApply UAE <onboarding@resend.dev>",
          to: employerEmail || cvProfile.email, // fallback to self if no employer email found
          replyTo: cvProfile.email,
          subject: `Job Application: ${job.job_title} - ${cvProfile.name}`,
          html: buildEmailHtml(cvProfile, job.job_title, job.employer_name),
          attachments,
        })

        if (error) {
          console.error("Resend error for", job.employer_name, error)
          results.push({
            job_id: job.job_id,
            job_title: job.job_title,
            employer_name: job.employer_name,
            apply_link: job.job_apply_link,
            sent_to: employerEmail || cvProfile.email,
            status: "failed" as const,
            message: `Email failed: ${error.message}`,
          })
        } else {
          results.push({
            job_id: job.job_id,
            job_title: job.job_title,
            employer_name: job.employer_name,
            apply_link: job.job_apply_link,
            sent_to: employerEmail || cvProfile.email,
            email_id: data?.id,
            status: "sent" as const,
            message: `Application email sent to ${employerEmail || cvProfile.email}`,
          })
        }
      } catch (err) {
        console.error("Email send error for", job.employer_name, err)
        results.push({
          job_id: job.job_id,
          job_title: job.job_title,
          employer_name: job.employer_name,
          apply_link: job.job_apply_link,
          sent_to: employerEmail || cvProfile.email,
          status: "failed" as const,
          message: `Failed to send email: ${err instanceof Error ? err.message : "Unknown error"}`,
        })
      }
    }

    const successful = results.filter((r) => r.status === "sent").length
    const failed = results.filter((r) => r.status === "failed").length

    return NextResponse.json({
      summary: {
        total: jobs.length,
        successful,
        failed,
        applicant: cvProfile.name,
      },
      results,
    })
  } catch (error) {
    console.error("Apply error:", error)
    return NextResponse.json(
      { error: "Failed to process applications" },
      { status: 500 }
    )
  }
}
