// app/api/analyze-clothing/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Groq from "groq-sdk"                          // ✅ correct import
import { CLOTHING_TYPES, COLORS, SEASONS, OCCASIONS, MATERIALS, FITS, PATTERNS } from "@/lib/types"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "AI not configured. Missing GROQ_API_KEY." },
        { status: 500 }
      )
    }

    // Receive the file directly as multipart
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })  // ✅ correct instantiation

    const prompt = `You are a fashion stylist AI. Analyze this clothing item image.

Return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "name": "<short descriptive name, e.g. Blue Oxford Shirt>",
  "type": "<one of: ${CLOTHING_TYPES.join(", ")}>",
  "color": "<one of: ${COLORS.join(", ")}>",
  "seasons": ["<one or more of: ${SEASONS.join(", ")}>"],
  "occasions": ["<one or more of: ${OCCASIONS.join(", ")}>"],
  "material": "<one of: ${MATERIALS.join(", ")}>",
  "fit": "<one of: ${FITS.join(", ")}>",
  "pattern": "<one of: ${PATTERNS.join(", ")}>"
}`

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    const text = response.choices[0]?.message?.content ?? ""

    // Strip markdown fences if present
    const cleaned = text.replace(/```json|```/g, "").trim()

    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error("Failed to parse AI response:", text)
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      name: typeof parsed.name === "string" ? parsed.name : null,
      type: CLOTHING_TYPES.includes(parsed.type) ? parsed.type : null,
      color: COLORS.includes(parsed.color) ? parsed.color : null,
      seasons: parsed.seasons?.filter((s: string) => SEASONS.includes(s as any)) ?? [],
      occasions: parsed.occasions?.filter((o: string) => OCCASIONS.includes(o as any)) ?? [],
      material: MATERIALS.includes(parsed.material) ? parsed.material : null,
      fit: FITS.includes(parsed.fit) ? parsed.fit : null,
      pattern: PATTERNS.includes(parsed.pattern) ? parsed.pattern : null,
    })
  } catch (error) {
    console.error("Error analyzing clothing:", error)
    return NextResponse.json(
      { error: "Failed to analyze clothing" },
      { status: 500 }
    )
  }
}