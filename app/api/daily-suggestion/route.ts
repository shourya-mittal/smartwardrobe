import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"

const DailySuggestionSchema = z.object({
  itemIds: z.array(z.number()),
  additionalItems: z.array(z.string()).optional(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(100),
  outfitTitle: z.string(),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

    // Check if we already generated today's suggestion
    const existing = await sql`
      SELECT ds.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'type', c.type,
              'color', c.color,
              'image_pathname', c.image_pathname
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as items
      FROM daily_suggestions ds
      LEFT JOIN daily_suggestion_items dsi ON ds.id = dsi.suggestion_id
      LEFT JOIN clothes c ON dsi.clothing_id = c.id
      WHERE ds.user_id = ${session.user.id}
        AND ds.date = ${today}
      GROUP BY ds.id
      LIMIT 1
    `

    if (existing.length > 0) {
      return NextResponse.json(existing[0])
    }

    // No suggestion yet for today — generate one
    // Get weather from query params if provided
    const { searchParams } = new URL(req.url)
    const weatherParam = searchParams.get("weather")
    const weather = weatherParam ? JSON.parse(decodeURIComponent(weatherParam)) : null

    // Get user's wardrobe
    const clothes = await sql`
      SELECT id, name, type, color, seasons, occasions, material, fit, pattern, image_pathname, last_worn_at
      FROM clothes
      WHERE user_id = ${session.user.id}
    `

    if (clothes.length === 0) {
      return NextResponse.json({ error: "No clothes in wardrobe" }, { status: 400 })
    }

    // Get user gender
    const userResult = await sql`
      SELECT gender FROM users WHERE id = ${session.user.id}
    `
    const userGender = userResult[0]?.gender ?? "prefer not to say"

    // Get outfits worn in the last 7 days to avoid repetition
    const recentOutfitItems = await sql`
      SELECT oi.clothing_id
      FROM outfit_items oi
      JOIN outfits o ON oi.outfit_id = o.id
      WHERE o.user_id = ${session.user.id}
        AND o.worn_at > NOW() - INTERVAL '7 days'
    `
    const recentItemIds = new Set(recentOutfitItems.map((o: any) => o.clothing_id))

    // Determine season from weather temp or current month
    let currentSeason: string
    if (weather?.temp) {
      if (weather.temp < 40) currentSeason = "winter"
      else if (weather.temp < 60) currentSeason = "fall"
      else if (weather.temp < 75) currentSeason = "spring"
      else currentSeason = "summer"
    } else {
      const month = new Date().getMonth() + 1
      if (month >= 3 && month <= 5) currentSeason = "spring"
      else if (month >= 6 && month <= 8) currentSeason = "summer"
      else if (month >= 9 && month <= 11) currentSeason = "fall"
      else currentSeason = "winter"
    }

    const clothingContext = clothes.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      color: item.color,
      seasons: item.seasons,
      occasions: item.occasions,
      material: item.material ?? "unknown",
      fit: item.fit ?? "regular",
      pattern: item.pattern ?? "solid",
      recentlyWorn: recentItemIds.has(item.id),
      lastWorn: item.last_worn_at
        ? new Date(item.last_worn_at).toLocaleDateString()
        : "never",
    }))

    const weatherContext = weather
      ? `- Temperature: ${weather.temp}°F (feels like ${weather.feelsLike}°F)
- Conditions: ${weather.description}
- Location: ${weather.location}`
      : `- Season: ${currentSeason} (no real-time weather available)`

    const prompt = `You are a personal fashion stylist AI. Pick the single BEST outfit for today from the user's wardrobe.

TODAY'S WEATHER:
${weatherContext}
Current Season: ${currentSeason}

OCCASION: casual (default daily wear)
GENDER: ${userGender}

AVAILABLE WARDROBE:
${JSON.stringify(clothingContext, null, 2)}

RULES:
1. Pick the single best outfit — quality over quantity
2. Strongly prefer items NOT recently worn (recentlyWorn: false, or lastWorn: "never")
3. Ensure color coordination — avoid clashing colors
4. Avoid clashing patterns — don't pair two bold patterns together
5. Match materials to weather — prefer linen/cotton for warm, wool/knit for cold
6. Consider fit cohesion
7. Include at least a top and bottom (or a dress)
8. Add outerwear if temp is below 60°F
9. Be gender-appropriate for: ${userGender}
10. Give the outfit a short creative title (e.g. "Cozy Monday", "Fresh Start", "Office Ready")

Return ONLY a raw JSON object. No markdown, no explanation. Start with { and end with }.

{
  "itemIds": [1, 2],
  "additionalItems": ["white sneakers"],
  "outfitTitle": "Cozy Monday",
  "reasoning": "short explanation of why this works",
  "confidence": 88
}`

    const result = await generateText({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      prompt,
    })

    let aiResponse
    try {
      let cleaned = result.text.trim()
      const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenceMatch) {
        cleaned = fenceMatch[1].trim()
      } else {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) cleaned = jsonMatch[0].trim()
      }

      const raw = JSON.parse(cleaned)
      const validated = DailySuggestionSchema.safeParse(raw)
      if (!validated.success) {
        console.error("Daily suggestion schema validation failed:", validated.error)
        return NextResponse.json({ error: "AI returned invalid format" }, { status: 500 })
      }
      aiResponse = validated.data
    } catch (err) {
      console.error("Invalid JSON from AI:", result.text)
      return NextResponse.json({ error: "AI returned invalid format" }, { status: 500 })
    }

    // Map IDs to full clothing objects, drop any hallucinated IDs
    const resolvedItems = aiResponse.itemIds
      .map((id: number) => {
        const item = clothes.find((c: any) => c.id === id)
        if (!item) return null
        return {
          id: item.id,
          name: item.name,
          type: item.type,
          color: item.color,
          image_pathname: item.image_pathname,
        }
      })
      .filter(Boolean)

    if (resolvedItems.length === 0) {
      return NextResponse.json({ error: "AI returned no valid items" }, { status: 500 })
    }

    // Save to DB so we don't regenerate today
    const saved = await sql`
      INSERT INTO daily_suggestions (user_id, date, outfit_title, reasoning, confidence, additional_items, weather_snapshot)
      VALUES (
        ${session.user.id},
        ${today},
        ${aiResponse.outfitTitle},
        ${aiResponse.reasoning},
        ${aiResponse.confidence},
        ${JSON.stringify(aiResponse.additionalItems ?? [])},
        ${weather ? JSON.stringify(weather) : null}
      )
      RETURNING *
    `

    const suggestion = saved[0]

    // Save suggestion items
    if (aiResponse.itemIds.length > 0) {
      const validIds = aiResponse.itemIds.filter((id: number) =>
        clothes.some((c: any) => c.id === id)
      )
      if (validIds.length > 0) {
        await sql`
          INSERT INTO daily_suggestion_items (suggestion_id, clothing_id)
          SELECT ${suggestion.id}, UNNEST(${validIds}::int[])
        `
      }
    }

    return NextResponse.json({
      ...suggestion,
      items: resolvedItems,
    })
  } catch (error) {
    console.error("Daily suggestion error:", error)
    return NextResponse.json({ error: "Failed to generate daily suggestion" }, { status: 500 })
  }
}

// Allow user to regenerate (skip cache for today)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toISOString().split("T")[0]

    await sql`
      DELETE FROM daily_suggestions
      WHERE user_id = ${session.user.id} AND date = ${today}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing daily suggestion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
