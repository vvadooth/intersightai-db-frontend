"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Document {
  id: string
  source: string
  ingested_at: string
  metadata: Record<string, any>
}

interface DocumentChunk {
  id: string
  chunk: string
  created_at: string
}

export function DocumentDialog({ document }: { document: Document }) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (chunks.length === 0) return
    toast.success("🔍 Chunks loaded successfully!")
  }, [chunks])

  async function fetchChunks() {
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${document.id}/chunks`)
      if (!res.ok) throw new Error("Failed to fetch chunks")
      const data = await res.json()
      setChunks(data)
    } catch (error) {
      toast.error("❌ Error loading chunks")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={fetchChunks} className="text-sm">View Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Document Details</DialogTitle>
          <DialogDescription>Metadata and chunks for this document.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm"><strong>Source:</strong> {document.source}</p>
          <p className="text-sm"><strong>Ingested At:</strong> {document.ingested_at}</p>
          <p className="text-sm"><strong>Metadata:</strong></p>
          <pre className="bg-gray-100 p-2 rounded-md text-sm overflow-auto">{JSON.stringify(document.metadata, null, 2)}</pre>

          <p className="text-sm"><strong>Chunks:</strong></p>
          {loading ? (
            <p className="text-gray-500">Loading chunks...</p>
          ) : chunks.length > 0 ? (
            <ul className="space-y-2">
              {chunks.map((chunk) => (
                <li key={chunk.id} className="p-2 border rounded-md bg-gray-200">
                  <p className="text-xs text-gray-600"><strong>Created At:</strong> {chunk.created_at}</p>
                  <p className="text-sm">{chunk.chunk}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No chunks available.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
