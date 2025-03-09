"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, ChevronDown } from "lucide-react";

interface Chunk {
  id: number;
  document_id: number;
  chunk: string;
  chunk_embedding: string;
  active: boolean;
  created_at: string;
}

export function ChunkDialog({ documentId }: { documentId: string }) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchChunks() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/history`);
      if (!res.ok) throw new Error("Failed to fetch chunks");
      const data = await res.json();
      setChunks(data);
      toast.success("📄 Chunks loaded successfully!");
    } catch (error) {
      toast.error("❌ Error fetching chunks.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Apply filters and search query
  const filteredChunks = chunks
    .filter((chunk) => {
      const matchesFilter = 
        filter === "active" ? chunk.active 
        : filter === "inactive" ? !chunk.active 
        : true;

      const matchesSearch = chunk.chunk.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      return sortOrder === "newest"
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={fetchChunks}>View Content</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Chunks</DialogTitle>
        </DialogHeader>

        {/* ✅ Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search chunks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* ✅ Filters & Sorting */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              onClick={() => setFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={filter === "inactive" ? "default" : "outline"}
              onClick={() => setFilter("inactive")}
            >
              Inactive
            </Button>
          </div>

          {/* 🔽 Sort Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            >
              {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[60vh] p-2">
            {filteredChunks.length > 0 ? (
              filteredChunks.map((chunk) => (
                <Dialog key={chunk.id}>
                  <DialogTrigger asChild>
                    <div 
                      className="p-3 border rounded-md cursor-pointer hover:bg-gray-100 transition-all flex items-center space-x-3"
                      onClick={() => setSelectedChunk(chunk)}
                    >
                      <div className={`w-3 h-3 rounded-full ${chunk.active ? "bg-green-500" : "bg-red-500"}`} />
                      <p className="font-mono truncate flex-1">{chunk.chunk}</p>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(chunk.created_at).toLocaleString()}
                      </p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Chunk Details</DialogTitle>
                    </DialogHeader>
                    {selectedChunk && (
                      <div className="space-y-4">
                        <div className="p-3 bg-gray-100 rounded-md">
                          <p className="text-sm font-medium">Chunk Text:</p>
                          <p className="font-mono text-sm">{selectedChunk.chunk}</p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-md">
                          <p className="text-sm font-medium">Chunk Embedding:</p>
                          <pre className="font-mono text-xs bg-gray-200 p-2 rounded-md max-h-40 overflow-y-auto break-words">
                            {JSON.stringify(JSON.parse(selectedChunk.chunk_embedding), null, 2)}
                          </pre>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-md flex justify-between items-center">
                          <p className="text-sm font-medium">Active:</p>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${selectedChunk.active ? "bg-green-500" : "bg-red-500"}`} />
                            <p className={`font-bold ${selectedChunk.active ? "text-green-600" : "text-red-600"}`}>
                              {selectedChunk.active ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-md flex justify-between">
                          <p className="text-sm font-medium">Created At:</p>
                          <p className="text-gray-500">{new Date(selectedChunk.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              ))
            ) : (
              <p className="text-center text-gray-500">No chunks available.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
