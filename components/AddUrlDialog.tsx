"use client";

import { useState } from "react";
import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import URLDetailsDialog from "./URLDetailsDialog";
import { Loader2 } from "lucide-react"; // 🔄 Import loading spinner icon

export default function AddUrlDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [isValidUrl, setIsValidUrl] = useState(true);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        setIsValidUrl(validateUrl(e.target.value) || e.target.value === "");
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const validateUrl = (inputUrl: string) => {
        const urlPattern = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;
        return urlPattern.test(inputUrl);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateUrl(url)) {
            setIsValidUrl(false);
            return;
        }
        if (!title.trim()) {
            return; // Prevent submission if the title is empty
        }

        setLoading(true);
        try {
            const res = await fetch("/api/add-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, title }),
            });

            const data = await res.json();

            if (!data) {
                throw new Error("Invalid response from API.");
            }

            setExtractedData(data);
        } catch (error) {
            console.error("❌ Error processing URL:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogOverlay className="bg-black/30" />
                <DialogContent className="max-w-md p-6 bg-white rounded-lg shadow-lg border">
                    <DialogTitle className="text-xl font-bold text-gray-900">Add URL</DialogTitle>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        {/* URL Input Field */}
                        <label htmlFor="url-input" className="block text-sm font-medium text-gray-700">
                            Enter a URL
                        </label>
                        <Input
                            id="url-input"
                            type="text"
                            placeholder="https://example.com"
                            value={url}
                            onChange={handleUrlChange}
                            className={`border p-2 rounded-md w-full ${!isValidUrl ? "border-red-500" : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {!isValidUrl && <p className="text-red-500 text-xs font-medium">⚠️ Invalid URL format</p>}

                        {/* Title Input Field (Required) */}
                        <label htmlFor="title-input" className="block text-sm font-medium text-gray-700">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="title-input"
                            type="text"
                            placeholder="Enter title"
                            value={title}
                            onChange={handleTitleChange}
                            className={`border p-2 rounded-md w-full ${!title.trim() ? "border-red-500" : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {!title.trim() && <p className="text-red-500 text-xs font-medium">⚠️ Title is required</p>}

                        {/* Buttons */}
                        <div className="flex justify-end space-x-2">
                            <Button type="submit" disabled={!url || !isValidUrl || !title.trim() || loading} className="flex items-center">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Submit"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Show extracted data in URL Details Dialog */}
            {extractedData && (
                <URLDetailsDialog
                    isOpen={!!extractedData}
                    onClose={() => {
                        setExtractedData(null);
                        onClose(); // This should close the outer AddUrlDialog as well.
                    }}
                    data={extractedData}
                />
            )}
        </>
    );
}
