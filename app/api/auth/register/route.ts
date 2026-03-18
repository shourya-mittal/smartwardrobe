import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { sql } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { name, email, password, gender } = await req.json()

    if (!name || !email || !password || !gender) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 100) {
      return NextResponse.json({ error: "Name must be between 1 and 100 characters" }, { status: 400 })
    }

    // Basic email format validation server-side
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    if (password.length < 6 || password.length > 100) {
      return NextResponse.json(
        { error: "Password must be between 6 and 100 characters" },
        { status: 400 }
      )
    }

    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const result = await sql`
      INSERT INTO users (name, email, password, gender)
      VALUES (${name}, ${email.toLowerCase()}, ${hashedPassword}, ${gender})
      RETURNING id
    `

    return NextResponse.json(
      { message: "User created successfully", userId: result[0].id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}