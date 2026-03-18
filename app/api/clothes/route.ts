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
    const type = searchParams.get("type")
    const color = searchParams.get("color")
    const season = searchParams.get("season")

    let clothes
    
    if (type && color && season) {
      clothes = await sql`
        SELECT * FROM clothes 
        WHERE user_id = ${session.user.id}
          AND type = ${type}
          AND color = ${color}
          AND ${season} = ANY(seasons)
        ORDER BY created_at DESC
      `
    } else if (type && color) {
      clothes = await sql`
        SELECT * FROM clothes 
        WHERE user_id = ${session.user.id}
          AND type = ${type}
          AND color = ${color}
        ORDER BY created_at DESC
      `
    } else if (type && season) {
      clothes = await sql`
        SELECT * FROM clothes 
        WHERE user_id = ${session.user.id}
          AND type = ${type}
          AND ${season} = ANY(seasons)
        ORDER BY created_at DESC
      `
    } else if (color && season) {
      clothes = await sql`
        SELECT * FROM clothes 
        WHERE user_id = ${session.user.id}
          AND color = ${color}
          AND ${season} = ANY(seasons)
        ORDER BY created_at DESC
      `
    } else if (type) {
      clothes = await sql`
        SELECT * FROM clothes 
        WHERE user_id = ${session.user.id}
          AND type = ${type}
        ORDER BY created_at DESC
      `
    } else if (color) {
      clothes = await sql`
        SELECT * FROM clothes 
        WHERE user_id = ${session.user.id}
          AND color = ${color}
        ORDER BY created_at DESC
      `
    } else if (season) {
      clothes = await sql`
        SELECT * FROM clothes 
        WHERE user_id = ${session.user.id}
          AND ${season} = ANY(seasons)
        ORDER BY created_at DESC
      `
    } else {
      clothes = await sql`
        SELECT * FROM clothes 
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json(clothes)
  } catch (error) {
    console.error("Error fetching clothes:", error)
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
    const { name, type, color, seasons, occasions, material, fit, pattern, imageUrl, imagePath } = body

    if (!name || !type || !color || !seasons || !occasions || !imagePath) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO clothes (user_id, name, type, color, seasons, occasions, material, fit, pattern, image_url, image_pathname)
      VALUES (${session.user.id}, ${name}, ${type}, ${color}, ${seasons}, ${occasions}, ${material ?? "other"}, ${fit ?? "regular"}, ${pattern ?? "solid"}, ${imageUrl || ""}, ${imagePath})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating clothing item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM clothes 
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting clothing item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
