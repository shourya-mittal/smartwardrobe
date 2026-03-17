import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"
import { WeatherData, Occasion } from "@/lib/types"

const OutfitSuggestionSchema = z.object({
  outfits: z.array(
    z.object({
      itemIds: z.array(z.number()),
      additionalItems: z.array(z.string()).optional(),
      reasoning: z.string().optional(),
      confidence: z.number().min(0).max(100),
    })
  ),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { weather, occasion }: { weather: WeatherData; occasion: Occasion } = body

    if (!weather || !occasion) {
      return NextResponse.json(
        { error: "Weather and occasion are required" },
        { status: 400 }
      )
    }

    // Get user's wardrobe
    const clothes = await sql`
      SELECT id, name, type, color, seasons, occasions, image_pathname, last_worn_at
      FROM clothes
      WHERE user_id = ${session.user.id}
    `

    if (clothes.length === 0) {
      return NextResponse.json(
        { error: "No clothes in wardrobe. Please add some items first." },
        { status: 400 }
      )
    }

    // Fetch user gender for gender-appropriate suggestions
    const userResult = await sql`
      SELECT gender FROM users WHERE id = ${session.user.id}
    `
    const userGender = userResult[0]?.gender ?? "prefer not to say"

    // Get recent outfits to avoid repetition
    const recentOutfitItems = await sql`
      SELECT oi.clothing_id
      FROM outfit_items oi
      JOIN outfits o ON oi.outfit_id = o.id
      WHERE o.user_id = ${session.user.id}
        AND o.worn_at > NOW() - INTERVAL '7 days'
    `

    const recentItemIds = new Set(
      recentOutfitItems.map((o: any) => o.clothing_id)
    )

    // Determine appropriate season based on temperature (Fahrenheit)
    let currentSeason: string
    if (weather.temp < 40) {
      currentSeason = "winter"
    } else if (weather.temp < 60) {
      currentSeason = "fall"
    } else if (weather.temp < 75) {
      currentSeason = "spring"
    } else {
      currentSeason = "summer"
    }

    // Build clothing context for AI
    const clothingContext = clothes.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      color: item.color,
      seasons: item.seasons,
      occasions: item.occasions,
      recentlyWorn: recentItemIds.has(item.id),
    }))

    const prompt = `You are a fashion stylist AI. Based on the following context, suggest 3 complete outfit combinations.

WEATHER:
- Temperature: ${weather.temp}°F (feels like ${weather.feelsLike}°F)
- Conditions: ${weather.description}
- Location: ${weather.location}
- Current Season: ${currentSeason}

OCCASION: ${occasion}
GENDER: ${userGender}

AVAILABLE WARDROBE:
${JSON.stringify(clothingContext, null, 2)}

RULES:
1. Each outfit should be appropriate for the weather and occasion
2. Prioritize items NOT recently worn (recentlyWorn: false)
3. Ensure color coordination and style matching
4. Include at least a top and bottom (or dress) in each outfit
5. Add outerwear if temperature is below 60°F
6. Consider adding accessories when appropriate
7. Each outfit MUST use a different combination of itemIds. Never repeat the same set of items across outfits. If the wardrobe is too small for 3 unique combinations, combine items in different ways or use subsets.
8. Suggest clothing and additionalItems appropriate for the user's gender. For example, do not suggest heels for male, do not suggest ties for female unless it is a style choice.

IMPORTANT:
Only use item IDs from the wardrobe list above for itemIds.
Do NOT invent new IDs.
If the wardrobe does not have enough items to make 3 fully unique outfits, you may add an "additionalItems" array of strings suggesting real clothing pieces to complement the outfit (e.g. "white sneakers", "black belt"). This array is optional and should only appear when needed.
Return exactly 3 outfit suggestions with confidence scores based on how well they match the criteria.
Return ONLY a raw JSON object with no explanation, no markdown, no code fences. Start your response with { and end with }.

{
  "outfits": [
    {
      "itemIds": [1, 2],
      "additionalItems": ["white sneakers"],
      "reasoning": "short explanation",
      "confidence": 85
    }
  ]
}`

    const result = await generateText({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      prompt,
    })

    let aiResponse
    try {
      let cleaned = result.text.trim()

      // If the model wrapped JSON in a code fence, extract just the JSON block
      const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenceMatch) {
        cleaned = fenceMatch[1].trim()
      } else {
        // No fences — find the raw JSON object in the text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleaned = jsonMatch[0].trim()
        }
      }

      const raw = JSON.parse(cleaned)
      const validated = OutfitSuggestionSchema.safeParse(raw)
      if (!validated.success) {
        console.error("AI response failed schema validation:", validated.error)
        return NextResponse.json(
          { error: "AI returned invalid format" },
          { status: 500 }
        )
      }
      aiResponse = validated.data
    } catch (err) {
      console.error("Invalid JSON from AI:", result.text)
      return NextResponse.json(
        { error: "AI returned invalid format" },
        { status: 500 }
      )
    }

    // Step 1 — map item IDs to full clothing objects, drop hallucinated IDs
    const mapped = aiResponse.outfits
      .map((outfit) => ({
        items: outfit.itemIds
          .map((id: number) => {
            const item = clothes.find((c: any) => c.id === id)
            if (!item) return null
            return {
              id: item.id,
              name: item.name,
              type: item.type,
              color: item.color,
              imagePath: item.image_pathname,
            }
          })
          .filter(Boolean),
        additionalItems: outfit.additionalItems ?? [],
        reasoning: outfit.reasoning ?? "",
        confidence: outfit.confidence,
      }))
      .filter((outfit) => outfit.items.length > 0)

    // Step 2 — deduplicate by itemIds
    // If the AI returned the same base items twice (only differing in additionalItems),
    // merge them into one outfit and combine their additionalItems lists
    const seen = new Map<string, number>()
    const suggestions: typeof mapped = []

    for (const outfit of mapped) {
      // Stable key from sorted item IDs so [3,4] and [4,3] are treated as the same
      const key = outfit.items
        .map((i: any) => i.id)
        .sort((a: any, b: any) => a - b)
        .join(",")

      if (seen.has(key)) {
        // Duplicate — merge additionalItems into the already-stored outfit
        const existingIndex = seen.get(key)!
        const merged = [
          ...suggestions[existingIndex].additionalItems,
          ...outfit.additionalItems,
        ]
        // Deduplicate the additionalItems themselves (case-insensitive)
        const unique = Array.from(
          new Map(merged.map((item) => [item.toLowerCase(), item])).values()
        )
        suggestions[existingIndex].additionalItems = unique
      } else {
        seen.set(key, suggestions.length)
        suggestions.push(outfit)
      }
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("AI suggestion error:", error)
    return NextResponse.json(
      { error: "Failed to generate outfit suggestions" },
      { status: 500 }
    )
  }
}