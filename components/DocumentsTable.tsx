"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, RefreshCcw, ArrowDownAZ, ArrowUpZA, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ChunkDialog } from "./ChunkDialog";
import { UpdateDocument } from "./UpdateDocument";
import { DeleteDocument } from "./DeleteDocument";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog"; // New Confirmation Dialog

interface Document {
    id: string;
    source: string;
    ingested_at: string;
    metadata: Record<string, any>;
    chunks?: string[];
}

export default function DocumentTable() {
    const [data, setData] = useState<Document[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [filterText, setFilterText] = useState("");
    const [loading, setLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // Default: Latest → Oldest
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(""); 

    useEffect(() => {
        fetchDocumentsWithChunks();
    }, []);

    async function fetchDocumentsWithChunks() {
        setLoading(true);
        try {
            const res = await fetch("/api/documents");
            if (!res.ok) throw new Error("Failed to fetch documents");
            const docs = await res.json();

            // ✅ Fetch chunks for all documents in parallel
            const enrichedDocs = await Promise.all(
                docs.map(async (doc: Document) => {
                    try {
                        const chunkRes = await fetch(`/api/documents/${doc.id}/history`);
                        if (chunkRes.ok) {
                            const chunks = await chunkRes.json();
                            return { ...doc, chunks: chunks.map((c: { chunk: string }) => c.chunk) };
                        }
                    } catch (error) {
                        console.error(`Failed to fetch chunks for doc ${doc.id}`, error);
                    }
                    return { ...doc, chunks: [] }; // Default empty chunks if request fails
                })
            );

            setData(enrichedDocs);
            toast.success("📄 Documents & chunks loaded successfully!");
        } catch (error) {
            toast.error("❌ Error fetching documents.");
        } finally {
            setLoading(false);
        }
    }

    function handleDelete(id: string) {
        setData((prev) => prev.filter((doc) => doc.id !== id));
    }

    async function handleBatchDelete() {
        setIsDeleting(true);
        setDeleteDialogOpen(false);

        for (const docId of selectedDocs) {
            try {
                const response = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
                if (!response.ok) throw new Error(`Failed to delete document ${docId}`);

                toast.success(`🗑️ Deleted document ${docId}`);
                handleDelete(docId);
            } catch (error) {
                toast.error(`❌ Error deleting document ${docId}`);
            }
        }

        setSelectedDocs([]);
        setIsDeleting(false);
    }

    // 🔄 Toggle Sorting Order
    function toggleSortOrder() {
        setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    }

    // 🔍 Filtering logic
    const filteredData = data.filter((doc) => {
        const searchLower = searchQuery.toLowerCase();
        const sourceMatch = doc.source.toLowerCase().includes(searchLower);
        const metadataMatch = JSON.stringify(doc.metadata).toLowerCase().includes(searchLower);
        const chunkMatch = doc.chunks?.some((chunk) => chunk.toLowerCase().includes(searchLower)) || false;

        return sourceMatch || metadataMatch || chunkMatch;
    });

    // 🗂️ Sort Data by Ingested Date
    const sortedData = [...filteredData].sort((a, b) => {
        return sortOrder === "desc"
            ? new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime()
            : new Date(a.ingested_at).getTime() - new Date(b.ingested_at).getTime();
    });

    return (
        <div className="rounded-md border p-4">
            {/* 🔍 Search Bar + Reload Button */}
            <div className="mb-4 flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2 border p-2 rounded-md w-full">
                    <Search className="w-5 h-5 text-gray-500" />
                    <Input
                        type="text"
                        placeholder="Search documents & chunks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* 🔄 Reload Button */}
                <Button onClick={fetchDocumentsWithChunks} disabled={loading} variant="outline">
                    <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* 🗑️ Delete Selected Button */}
            {selectedDocs.length > 0 && (
                <div className="mb-2 flex justify-end">
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={isDeleting}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isDeleting ? "Deleting..." : `Delete Selected (${selectedDocs.length})`}
                    </Button>
                </div>
            )}

<div className="h-[60vh] overflow-y-auto border rounded-md">
            {/* 📄 Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <Checkbox
                                checked={selectedDocs.length === sortedData.length && sortedData.length > 0}
                                onCheckedChange={(checked) =>
                                    setSelectedDocs(checked ? sortedData.map((doc) => doc.id) : [])
                                }
                            />
                        </TableHead>
                        <TableHead>Source</TableHead>

                        {/* 📆 Ingested At Column with Sort Toggle */}
                        <TableHead className="cursor-pointer flex items-center space-x-2" onClick={toggleSortOrder}>
                            <span>Ingested At</span>
                            {sortOrder === "desc" ? (
                                <ArrowDownAZ className="w-4 h-4" />
                            ) : (
                                <ArrowUpZA className="w-4 h-4" />
                            )}
                        </TableHead>

                        <TableHead>Metadata</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.length ? (
                        sortedData.map((doc) => (
                            <TableRow key={doc.id}>
                                {/* ✅ Multi-Select Checkbox */}
                                <TableCell>
                                    <Checkbox
                                        checked={selectedDocs.includes(doc.id)}
                                        onCheckedChange={(checked) =>
                                            setSelectedDocs((prev) =>
                                                checked ? [...prev, doc.id] : prev.filter((id) => id !== doc.id)
                                            )
                                        }
                                    />
                                </TableCell>

                                {/* ✅ Source Column (With Tooltip) */}
                                <TableCell>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="truncate cursor-pointer">
                                                    {doc.source.length > 30 ? doc.source.slice(0, 30) + "..." : doc.source}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="break-all">{doc.source}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>

                                {/* 📆 Ingested At Column */}
                                <TableCell>{new Date(doc.ingested_at).toLocaleString()}</TableCell>

                                {/* 📝 Metadata Column */}
                                {/* 📝 Metadata Column */}
                                <TableCell>
  <div className="text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
    {Object.keys(doc.metadata).length > 0 ? (
      <ul className="space-y-1">
        {Object.entries(doc.metadata).map(([key, value]) => {
          // Convert value to string and apply truncation if needed
          const stringValue =
            typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
          const maxLength = 50; // Adjust the max length as needed
          const truncatedValue =
            stringValue.length > maxLength
              ? `${stringValue.slice(0, maxLength)}...`
              : stringValue;

          return (
            <li key={key} className="flex justify-between">
              <span className="font-medium">{key}:</span>
              
              {/* Tooltip Wrapper for Truncated Content */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                  <span className="text-gray-600 truncate max-w-[100px] cursor-pointer block overflow-hidden whitespace-nowrap">
                  {truncatedValue}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {stringValue}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          );
        })}
      </ul>
    ) : (
      <span className="text-gray-500">No metadata</span>
    )}
  </div>
</TableCell>


                                {/* 🎬 Actions Column */}
                                <TableCell className="flex space-x-2">
                                    <ChunkDialog documentId={doc.id} />
                                    <UpdateDocument documentId={doc.id} existingMetadata={doc.metadata} />
                                    <DeleteDocument documentId={doc.id} onDelete={handleDelete} />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No results found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>
            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleBatchDelete}
                count={selectedDocs.length}
            />
        </div>
    );
}
