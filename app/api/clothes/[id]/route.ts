import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 })
    }

    const body = await req.json()
    const { name, type, color, seasons, occasions, material, fit, pattern } = body

    if (!name || !type || !color || !seasons || !occasions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      UPDATE clothes
      SET
        name      = ${name},
        type      = ${type},
        color     = ${color},
        seasons   = ${seasons},
        occasions = ${occasions},
        material  = ${material ?? "other"},
        fit       = ${fit ?? "regular"},
        pattern   = ${pattern ?? "solid"},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating clothing item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}