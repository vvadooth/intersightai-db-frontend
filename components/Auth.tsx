"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function Auth({ onAuth }: { onAuth: (isLoggedIn: boolean) => void }) {
  const [token, setToken] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // 🔍 Check authentication on page load
  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth")
      const data = await res.json()
      setIsAuthenticated(data.isAuthenticated)
      onAuth(data.isAuthenticated)
    }
    checkAuth()
  }, [onAuth])

  // 🔑 Handle Login
  async function handleLogin() {
    if (!token.trim()) return

    const loginToast = toast.loading("Logging in...")

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })

    if (res.ok) {
      toast.success("Logged in successfully!", { id: loginToast })
      setIsAuthenticated(true)
      onAuth(true)
      router.refresh()
    } else {
      toast.error("Invalid token. Please try again.", { id: loginToast })
    }
  }

  // 🚪 Handle Logout
  async function handleLogout() {
    toast.info("🔄 Logging out...")
    await fetch("/api/auth", { method: "DELETE" })
    toast.success("Logged out successfully!")
    setIsAuthenticated(false)
    onAuth(false)
    router.refresh()
  }

  return (
    <div className="absolute top-4 right-4">
      {isAuthenticated ? (
        <Button onClick={handleLogout} variant="destructive">
          Sign Out
        </Button>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <Input 
            type="password" 
            placeholder="Enter token..." 
            value={token} 
            onChange={(e) => setToken(e.target.value)}
          />
          <Button 
            onClick={handleLogin} 
            disabled={!token.trim()}
          >
            Log In
          </Button>
        </div>
      )}
    </div>
  )
}
