"use client"

import { useState, useEffect } from "react"
import Auth from "@/components/Auth"
import DocumentTable from "@/components/DocumentsTable"
import UploadDialog from "@/components/UploadDialog"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth")
      const data = await res.json()
      setIsAuthenticated(data.isAuthenticated)
    }
    checkAuth()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Auth onAuth={setIsAuthenticated} />
      {isAuthenticated && (
        <div className="w-full max-w-5xl mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Documents</h2>
            <Button onClick={() => setIsUploadDialogOpen(true)}>Upload PDF / Submit URL</Button>
          </div>
          <DocumentTable />
        </div>
      )}
      <UploadDialog isOpen={isUploadDialogOpen} onClose={() => setIsUploadDialogOpen(false)} />
    </div>
  )
}
