"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function PDFDetailsDialog({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: {
    source: string;
    content: string;
    metadata: {
      title: string;
      size: number;
      file_type: string;
      confidentiality: string;
    };
  };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitDialog, setExitDialog] = useState(false);

  const [editedTitle, setEditedTitle] = useState(data.metadata.title);
  const [editedContent, setEditedContent] = useState(data.content);
  const [editedConfidentiality, setEditedConfidentiality] = useState(data.metadata.confidentiality);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSubmitting) {
        event.preventDefault();
        setExitDialog(true);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: data.source,
          content: editedContent,
          metadata: {
            title: editedTitle,
            size: editedContent.length,
            file_type: data.metadata.file_type,
            confidentiality: editedConfidentiality,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.status}`);
      }

      onClose();
      window.dispatchEvent(new Event("resetUploadState"));
    } catch (error) {
      console.error("❌ Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    if (isSubmitting) {
      setExitDialog(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogOverlay />
        <DialogContent className="max-w-lg p-6 bg-white rounded-lg shadow-lg">
          <DialogTitle>
            <VisuallyHidden>PDF Details</VisuallyHidden>
          </DialogTitle>

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="border rounded-md p-2 w-full"
            />

            <label className="text-sm font-medium text-gray-700">Confidentiality</label>
            <select
              value={editedConfidentiality}
              onChange={(e) => setEditedConfidentiality(e.target.value)}
              className="border p-2 rounded-md w-full"
            >
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
            </select>

            <label className="text-sm font-medium text-gray-700">Extracted or Manual Content</label>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-32 p-2 border rounded-md resize-none"
            />

            <div>
              <label className="text-sm font-medium text-gray-700">Source</label>
              <p className="text-sm break-words">{data.source}</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={isSubmitting || !editedContent.trim() || !editedTitle.trim()}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation */}
      <Dialog open={exitDialog} onOpenChange={() => setExitDialog(false)}>
        <DialogOverlay />
        <DialogContent className="max-w-sm p-6 bg-white rounded-lg shadow-lg">
          <DialogTitle className="text-red-600 font-bold">Warning</DialogTitle>
          <p>Submission is in progress. Are you sure you want to exit? You will lose all progress.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setExitDialog(false)}>Stay</Button>
            <Button variant="destructive" onClick={() => { setExitDialog(false); onClose(); }}>
              Exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
