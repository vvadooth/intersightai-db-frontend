"use client";

import { useState, useEffect } from "react";
import Auth from "@/components/Auth";
import DocumentTable from "@/components/DocumentsTable";
import UploadDialog from "@/components/UploadDialog";
import AddUrlDialog from "@/components/AddUrlDialog";
import { Button } from "@/components/ui/button";
import PlaygroundModal from "@/components/PlaygroundModal";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth");
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
    }
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Auth onAuth={setIsAuthenticated} />
      {isAuthenticated && (
        <div className="w-full max-w-5xl mt-10">
          <div className="flex justify-between items-center mb-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Documents</h2>
              <p className="mt-1 text-sm text-gray-600">
                URLs are automatically re-ingested every Monday at midnight (PST).
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setIsUploadDialogOpen(true)}>Upload PDF</Button>
              <Button onClick={() => setIsUrlDialogOpen(true)}>Add URL</Button>
            </div>
          </div>
          <DocumentTable />
        </div>
      )}
      <UploadDialog isOpen={isUploadDialogOpen} onClose={() => setIsUploadDialogOpen(false)} />
      <AddUrlDialog isOpen={isUrlDialogOpen} onClose={() => setIsUrlDialogOpen(false)} />

      {/* Render the PlaygroundModal; its own button is fixed in the bottom left */}
      <PlaygroundModal />
    </div>
  );
}
