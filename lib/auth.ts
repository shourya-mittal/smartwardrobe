import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { sql } from "./db"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const users = await sql`
          SELECT id, email, name, password, gender 
          FROM users 
          WHERE email = ${credentials.email.toLowerCase()}
        `

        const user = users[0]
        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          gender: user.gender ?? null,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  debug: false,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.gender = user.gender ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.gender = token.gender as string | undefined
      }
      return session
    },
  },
}

declare module "next-auth" {
  interface User {
    gender?: string | null   // ← this was missing — augments the base User type
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      gender?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    gender?: string
  }
}