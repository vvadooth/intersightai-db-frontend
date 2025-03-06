"use client"

import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export default function PDFDetailsDialog({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean
  onClose: () => void
  data: {
    source: string
    content: string
    metadata: {
      title: string
      size: number
      file_type: string
      confidentiality: string
    }
  }
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent className="max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <DialogTitle>
          <VisuallyHidden>PDF Details</VisuallyHidden>
        </DialogTitle>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">{data.metadata.title}</h2>
          <p className="text-sm text-gray-600">File Type: {data.metadata.file_type}</p>
          <p className="text-sm text-gray-600">Size: {(data.metadata.size / 1024).toFixed(2)} KB</p>
          <p className="text-sm text-gray-600">Confidentiality: {data.metadata.confidentiality}</p>

          <div className="border-t pt-4">
            <h3 className="font-semibold">Extracted Content</h3>
            <p className="text-sm text-gray-800 h-32 overflow-auto">
              {data.content || "No content extracted."}
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold">Source</h3>
            <a
              href={data.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              View PDF
            </a>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
