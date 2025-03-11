"use client";

import { useState } from "react";
import { Dialog, DialogDescription, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import URLDetailsDialog from "./URLDetailsDialog";
import { Loader2 } from "lucide-react"; // 🔄 Loading spinner
import { toast } from "sonner"; // ✅ Import Sonner toast system


const ALLOWED_DOMAINS = ["intersight.com"];
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;


export default function AddUrlDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [isValidUrl, setIsValidUrl] = useState(true);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isAllowedDomain, setIsAllowedDomain] = useState(true);
    const [isYouTube, setIsYouTube] = useState(false);


        // 🔍 Check if the domain is allowed
        const isDomainAllowed = (inputUrl: string) => {
            try {
                const urlObj = new URL(inputUrl);
                return ALLOWED_DOMAINS.some(domain => urlObj.hostname.endsWith(domain));
            } catch (error) {
                return false; // Invalid URLs automatically fail
            }
        };

    // Remove URL fragment (#...)
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputUrl = e.target.value.trim();

        try {
            const urlObj = new URL(inputUrl);
            urlObj.hash = "";
            inputUrl = urlObj.toString();
        } catch (error) {}

        setUrl(inputUrl);
        setIsValidUrl(validateUrl(inputUrl) || inputUrl === "");
        setIsAllowedDomain(isDomainAllowed(inputUrl));
        setIsYouTube(YOUTUBE_REGEX.test(inputUrl));
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const validateUrl = (inputUrl: string) => {
        const urlPattern = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;
        return urlPattern.test(inputUrl);
    };

    // 🔍 Check if the document already exists
    const checkDocumentExists = async (source: string) => {
        try {
            const res = await fetch("/api/documents/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source }),
            });

            return await res.json();
        } catch (error) {
            console.error("❌ Error checking document existence:", error);
            toast.error("Failed to check document existence.");
            return { error: "Failed to check document existence." };
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateUrl(url)) {
            setIsValidUrl(false);
            return;
        }

        if (!isYouTube && !isDomainAllowed(url)) {
            setIsAllowedDomain(false);
            toast.error("🚫 This domain is not allowed.");
            return;
        }

        // ✅ Skip title validation for YouTube videos
        if (!title.trim() && !isYouTube) {
            toast.error("⚠️ Title is required for non-YouTube URLs.");
            return;
        }

        setLoading(true);
        try {
            // 🔍 Step 1: Check if document already exists
            const checkResponse = await checkDocumentExists(url);

            if (checkResponse.exists) {
                if (checkResponse.reactivation) {
                    toast.warning("This document was previously deleted.", {
                        action: {
                            label: "Reactivate",
                            onClick: handleReactivate,
                        },
                    });
                    setLoading(false);
                    return;
                } else {
                    toast.info("This document has already been ingested.");
                    setLoading(false);
                    return;
                }
            }

            const apiUrl = isYouTube ? "/api/add-yt-video" : "/api/add-url";
            const payload = isYouTube ? { video_url: url } : { url, title };

            // 🚀 Step 2: Proceed with document submission
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!data) throw new Error("Invalid response from API.");

            toast.success("Document has been successfully ingested.");
            toast.success(isYouTube ? "YouTube transcript extracted successfully." : "Document successfully ingested.");

            setExtractedData(data);
        } catch (error) {
            console.error("❌ Error processing URL:", error);
            toast.error("Failed to process URL.");
        } finally {
            setLoading(false);
        }
    };

    const handleReactivate = async () => {
        try {
            const res = await fetch("/api/reactivate-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!res.ok) throw new Error("Failed to reactivate document.");

            toast.success("Document has been successfully reactivated.");
        } catch (error) {
            console.error("❌ Error reactivating document:", error);
            toast.error("Failed to reactivate document.");
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogOverlay className="bg-black/30" />
                <DialogContent className="max-w-md p-6 bg-white rounded-lg shadow-lg border">
                    <DialogTitle className="text-xl font-bold text-gray-900">Add URL</DialogTitle>
                    <DialogDescription> We accept Intersight.com and Youtube.com URLs</DialogDescription>
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

{/* Title Input Field (Hidden for YouTube) */}
{!isYouTube && (
                            <>
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
                            </>
                        )}

                        {/* Buttons */}
                        <div className="flex justify-end space-x-2">
                        <Button type="submit" disabled={!url || !isValidUrl || (loading && !isYouTube)} className="flex items-center">
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
