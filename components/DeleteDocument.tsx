"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash } from "lucide-react";

interface DeleteDocumentProps {
  documentId: string;
  onDelete: (id: string) => void;
}

export function DeleteDocument({ documentId, onDelete }: DeleteDocumentProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("⚠️ Are you sure you want to delete this document?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete document.");
      
      toast.success("🗑️ Document deleted successfully!");
      onDelete(documentId);
    } catch (error) {
      toast.error("❌ Error deleting document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="icon" onClick={handleDelete} disabled={loading}>
      <Trash className="w-4 h-4" />
    </Button>
  );
}
