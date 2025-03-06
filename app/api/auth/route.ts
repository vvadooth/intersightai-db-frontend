import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Secure environment variable for authentication
const SECURITY_TOKEN = process.env.SECURITY_TOKEN || "supersecrettoken"

// ✅ LOGIN - Store auth token in an HTTP-only cookie
export async function POST(req: Request) {
  const { token } = await req.json()

  if (!token || token !== SECURITY_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const response = NextResponse.json({ message: "Logged in" })
  response.cookies.set("SECURITY_TOKEN", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return response
}

// ✅ CHECK AUTH - Verify if the user is authenticated
export async function GET() {
  const token = (await cookies()).get("SECURITY_TOKEN")

  return NextResponse.json({ isAuthenticated: !!token })
}

// ✅ LOGOUT - Remove the authentication token
export async function DELETE() {
  const response = NextResponse.json({ message: "Logged out" })
  response.cookies.delete("SECURITY_TOKEN")
  return response
}
