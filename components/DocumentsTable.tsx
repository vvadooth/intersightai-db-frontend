"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { ChunkDialog } from "./ChunkDialog";
import { UpdateDocument } from "./UpdateDocument";
import { DeleteDocument } from "./DeleteDocument";

interface Document {
  id: string;
  source: string;
  ingested_at: string;
  metadata: Record<string, any>;
}

export default function DocumentTable() {
  const [data, setData] = useState<Document[]>([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const docs = await res.json();
      setData(docs);
      toast.success("📄 Documents loaded successfully!");
    } catch (error) {
      toast.error("❌ Error fetching documents.");
    }
  }

  function handleDelete(id: string) {
    setData((prev) => prev.filter((doc) => doc.id !== id));
  }

  // 🔍 Filtering logic
  const filteredData = data.filter((doc) => {
    const sourceMatch = doc.source.toLowerCase().includes(filterText.toLowerCase());
    const metadataMatch = JSON.stringify(doc.metadata).toLowerCase().includes(filterText.toLowerCase());
    return sourceMatch || metadataMatch;
  });

  return (
    <div className="rounded-md border p-4">
      {/* 🔍 Search Bar */}
      <div className="mb-4 flex items-center space-x-2 border p-2 rounded-md">
        <Search className="w-5 h-5 text-gray-500" />
        <Input
          type="text"
          placeholder="Search documents..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {/* 📄 Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Ingested At</TableHead>
            <TableHead>Metadata</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length ? (
            filteredData.map((doc) => (
              <TableRow key={doc.id}>
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
                <TableCell>
                  <div className="text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
                    {Object.keys(doc.metadata).length > 0 ? (
                      <ul className="space-y-1">
                        {Object.entries(doc.metadata).map(([key, value]) => (
                          <li key={key} className="flex justify-between">
                            <span className="font-medium">{key}:</span>
                            <span className="text-gray-600">
                              {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                            </span>
                          </li>
                        ))}
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
              <TableCell colSpan={4} className="h-24 text-center">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
