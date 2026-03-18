import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limitRaw = parseInt(searchParams.get("limit") || "10")
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 10 : limitRaw), 50)

    const outfits = await sql`
      SELECT 
        o.*,
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
      FROM outfits o
      LEFT JOIN outfit_items oi ON o.id = oi.outfit_id
      LEFT JOIN clothes c ON oi.clothing_id = c.id
      WHERE o.user_id = ${session.user.id}
      GROUP BY o.id
      ORDER BY o.worn_at DESC
      LIMIT ${limit}
    `

    return NextResponse.json(outfits)
  } catch (error) {
    console.error("Error fetching outfits:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { items, occasion, weather, aiGenerated = false } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      )
    }

    // Security: verify all clothing items belong to the current user
    const validItems = await sql`
      SELECT id FROM clothes
      WHERE id = ANY(${items}::int[]) AND user_id = ${session.user.id}
    `
    const validIds = validItems.map((r: any) => r.id)
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid items found" }, { status: 400 })
    }

    // Create the outfit
    const outfitResult = await sql`
      INSERT INTO outfits (user_id, occasion, weather, ai_generated)
      VALUES (${session.user.id}, ${occasion || null}, ${weather || null}, ${aiGenerated})
      RETURNING *
    `

    const outfit = outfitResult[0]

    // Add outfit items (only verified ones)
    await sql`
      INSERT INTO outfit_items (outfit_id, clothing_id)
      SELECT ${outfit.id}, UNNEST(${validIds}::int[])
    `

    // Update last_worn_at only for verified items
    await sql`
      UPDATE clothes 
      SET last_worn_at = NOW()
      WHERE id = ANY(${validIds}::int[]) AND user_id = ${session.user.id}
    `

    return NextResponse.json(outfit, { status: 201 })
  } catch (error) {
    console.error("Error creating outfit:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}