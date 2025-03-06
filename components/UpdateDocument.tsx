"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Edit } from "lucide-react";

interface UpdateDocumentProps {
  documentId: string;
  existingMetadata: Record<string, any>;
}

export function UpdateDocument({ documentId, existingMetadata }: UpdateDocumentProps) {
  const [metadata, setMetadata] = useState(JSON.stringify(existingMetadata, null, 2));
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: JSON.parse(metadata) }),
      });

      if (!response.ok) throw new Error("Failed to update document.");
      toast.success("✅ Document updated successfully!");
    } catch (error) {
      toast.error("❌ Error updating document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Document Metadata</DialogTitle>
        </DialogHeader>
        <textarea
          className="w-full h-40 p-2 border rounded-md bg-gray-50 text-sm"
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
        />
        <Button disabled={loading} onClick={handleUpdate} className="w-full">
          {loading ? "Updating..." : "Save Changes"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
