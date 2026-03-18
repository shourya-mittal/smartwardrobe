import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { compare, hash } from "bcryptjs"

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, currentPassword, newPassword } = body

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
      }
      if (name.trim().length > 100) {
        return NextResponse.json({ error: "Name too long" }, { status: 400 })
      }
    }

    // If changing password, verify current password first
    if (newPassword !== undefined) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
      }
      if (newPassword.length > 100) {
        return NextResponse.json({ error: "Password too long" }, { status: 400 })
      }

      // Fetch current hashed password
      const users = await sql`
        SELECT password FROM users WHERE id = ${session.user.id}
      `
      if (!users[0]?.password) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const isValid = await compare(currentPassword, users[0].password)
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      const hashedNew = await hash(newPassword, 12)

      await sql`
        UPDATE users SET password = ${hashedNew} WHERE id = ${session.user.id}
      `
    }

    // Update name if provided
    if (name !== undefined) {
      await sql`
        UPDATE users SET name = ${name.trim()} WHERE id = ${session.user.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}