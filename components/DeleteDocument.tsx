"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash } from "lucide-react";

interface DeleteDocumentProps {
  documentId: string;
  onDelete: (id: string) => void;
}

export function DeleteDocument({ documentId, onDelete }: DeleteDocumentProps) {
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete document.");
      
      toast.success("🗑️ Document deleted successfully!");
      onDelete(documentId);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("❌ Error deleting document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="destructive" size="icon" onClick={() => setIsDialogOpen(true)} disabled={loading}>
        <Trash className="w-4 h-4" />
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogOverlay />
        <DialogContent className="max-w-sm p-6 bg-white rounded-lg shadow-lg">
          <DialogTitle className="text-red-600 font-bold">Confirm Deletion</DialogTitle>
          <p>⚠️ Are you sure you want to delete this document? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
