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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
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
