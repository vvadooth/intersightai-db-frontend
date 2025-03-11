"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function URLDetailsDialog({
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
    const [editedFileType, setEditedFileType] = useState(data.metadata.file_type);
    const [editedConfidentiality, setEditedConfidentiality] = useState(data.metadata.confidentiality);

    // Prevent closing the tab while submitting
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
        console.log("📤 Submitting extracted URL data...");

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
                        file_type: editedFileType,
                        confidentiality: editedConfidentiality,
                    },
                }),
            });

            console.log("📡 Response Received. Status:", response.status);

            if (!response.ok) {
                throw new Error(`❌ Submission failed: ${response.status} - ${response.statusText}`);
            }

            console.log("✅ URL submitted successfully!");
            toast.success("Document submitted successfully!");

            // After successful submission, close all dialogs.
            onClose();
        } catch (error) {
            console.error("❌ Error submitting URL:", error);
            toast.error("Failed to submit document.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
                <DialogOverlay />
                <DialogContent className="max-w-lg p-6 bg-white rounded-lg shadow-lg">
                    <DialogTitle>
                        <VisuallyHidden>URL Details</VisuallyHidden>
                    </DialogTitle>

                    <div className="space-y-4">
                        {/* Editable Title */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">Title</label>
                            <Input
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="border p-2 rounded-md w-full"
                            />
                        </div>

                        {/* Editable File Type */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">File Type</label>
                            <select
                                value={editedFileType}
                                onChange={(e) => setEditedFileType(e.target.value)}
                                className="border p-2 rounded-md w-full"
                            >
                                <option value="url">URL</option>
                                <option value="pdf">PDF</option>
                                <option value="video">Video</option>
                                <option value="text">Text</option>
                            </select>
                        </div>

                        {/* Live Character Count */}
                        <p className="text-sm text-gray-600">Size: {editedContent.length} characters</p>

                        {/* Editable Confidentiality */}
                        <div>
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
                        </div>

                        {/* Editable Extracted Content */}
                        <div className="border-t pt-4">
                            <h3 className="font-semibold">Extracted Content</h3>
                            <Textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full p-2 border rounded-md h-32 resize-none"
                            />
                        </div>

                        {/* Source Link */}
                        <div className="border-t pt-4">
                            <h3 className="font-semibold">Source</h3>
                            <a href={data.source} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                View Page
                            </a>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Exit Confirmation Dialog */}
            <Dialog open={exitDialog} onOpenChange={() => setExitDialog(false)}>
                <DialogOverlay />
                <DialogContent className="max-w-sm p-6 bg-white rounded-lg shadow-lg">
                    <DialogTitle className="text-red-600 font-bold">Warning</DialogTitle>
                    <p>Submission is in progress. Are you sure you want to exit? You will lose all progress.</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setExitDialog(false)}>Stay</Button>
                        <Button variant="destructive" onClick={() => { setExitDialog(false); onClose(); }}>Exit</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
