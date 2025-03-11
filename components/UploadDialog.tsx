"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import PDFDetailsDialog from "@/components/PDFDetailsDialog"

export default function UploadDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState<string>("")
  const [uploadedData, setUploadedData] = useState<any>(null)
  const [fileInputKey, setFileInputKey] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [errorDialog, setErrorDialog] = useState<string | null>(null)
  const [validationDialog, setValidationDialog] = useState<boolean>(false)

  // Warn user before closing or reloading the page if processing is in progress
  useEffect(() => {

    
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (loading) {
        event.preventDefault()
        event.returnValue = "Upload is in progress. Are you sure you want to leave?"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [loading])

  useEffect(() => {
    const handleReset = () => {
      onClose(); // Close the upload dialog
    };
  
    window.addEventListener("resetUploadState", handleReset);
    return () => window.removeEventListener("resetUploadState", handleReset);
  }, [onClose]);
  

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFile(null)
      setTitle("")
      setFileInputKey(prev => prev + 1)
      setUploadedData(null)
      setLoading(false)
      setElapsedTime(0)
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOpen, intervalId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/pdf") {
        setErrorDialog("Only PDF files are allowed.")
        return
      }
      setFile(selectedFile)

      // Extract filename without extension as the default title
      const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "")
      setTitle(fileNameWithoutExt)
    }
  }

  const clearFile = () => {
    setFile(null)
    setTitle("")
    setFileInputKey(prev => prev + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) {
      setValidationDialog(true)
      return
    }
    setLoading(true)
    setElapsedTime(0)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title)

    const startTime = Date.now()

    // Start interval to update elapsed time
    const interval = setInterval(() => {
      setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1) as unknown as number)
    }, 1000)
    setIntervalId(interval)

    try {
      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      setUploadedData(data) // Store response
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      clearInterval(interval)
      setIntervalId(null)
      const endTime = Date.now()
      setElapsedTime(((endTime - startTime) / 1000).toFixed(1) as unknown as number)
      setLoading(false)
    }
  }

  // Handle closing the modal with a confirmation prompt
  const handleClose = () => {
    if (loading) {
      const confirmClose = window.confirm("Upload is in progress. Are you sure you want to close?")
      if (!confirmClose) return
    }
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogOverlay />
        <DialogContent className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <DialogTitle>
            <VisuallyHidden>Upload PDF</VisuallyHidden>
          </DialogTitle>
          <Card>
            <CardHeader>
              <CardTitle>Upload a PDF</CardTitle>
              <CardDescription>Select a PDF and provide a title.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                {/* File Upload */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="pdf-upload" className="font-semibold">Upload PDF</label>
                  <div className="flex items-center gap-2">
                    <input
                      key={fileInputKey}
                      id="pdf-upload"
                      type="file"
                      accept="application/pdf"
                      className="border p-2 rounded flex-1"
                      onChange={handleFileChange}
                      disabled={!!file || loading}
                    />
                    {file && (
                      <Button variant="outline" size="sm" onClick={clearFile} disabled={loading}>
                        Clear
                      </Button>
                    )}
                  </div>
                  {file && (
                    <p className="text-sm text-gray-600">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                {/* Title Input (Only show when a file is selected) */}
                {file && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="title-input" className="font-semibold">Title</label>
                    <Input
                      id="title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Loading Indicator */}
                {loading && (
                  <div className="text-center text-sm text-gray-600">
                    <p>Processing... (Elapsed: {elapsedTime}s)</p>
                    <p className="text-red-500 font-semibold">Please don&apos;t close this modal</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button type="submit" disabled={!file || !title || loading}>
                  {loading ? "Uploading..." : "Upload"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Open PDF Details Dialog after Upload */}
      {uploadedData && (
        <PDFDetailsDialog
          isOpen={!!uploadedData}
          onClose={() => setUploadedData(null)}
          data={uploadedData}
        />
      )}


      {/* Error Dialog */}
      <Dialog open={!!errorDialog} onOpenChange={() => setErrorDialog(null)}>
        <DialogOverlay />
        <DialogContent className="max-w-sm p-6 bg-white rounded-lg shadow-lg">
          <DialogTitle className="text-red-600 font-bold">Error</DialogTitle>
          <p>{errorDialog}</p>
          <Button onClick={() => setErrorDialog(null)} className="mt-4">
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Validation Dialog */}
      <Dialog open={validationDialog} onOpenChange={() => setValidationDialog(false)}>
        <DialogOverlay />
        <DialogContent className="max-w-sm p-6 bg-white rounded-lg shadow-lg">
          <DialogTitle className="text-yellow-600 font-bold">Warning</DialogTitle>
          <p>Please provide a title and a PDF file before submitting.</p>
          <Button onClick={() => setValidationDialog(false)} className="mt-4">
            OK
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
