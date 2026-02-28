import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query") || "software developer"
  const page = searchParams.get("page") || "1"
  const employmentType = searchParams.get("employment_type") || ""
  const datePosted = searchParams.get("date_posted") || "all"

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    )
  }

  const params = new URLSearchParams({
    query: `${query} in UAE`,
    page,
    num_pages: "1",
    date_posted: datePosted,
    country: "ae",
    ...(employmentType && { employment_types: employmentType }),
  })

  const url = `https://jsearch.p.rapidapi.com/search?${params.toString()}`

  try {
    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("JSearch API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch jobs:", error)
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    )
  }
}
