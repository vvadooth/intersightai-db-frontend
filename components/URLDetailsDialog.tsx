"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
                    content: data.content,
                    metadata: data.metadata,
                }),
            });

            console.log("📡 Response Received. Status:", response.status);

            if (!response.ok) {
                throw new Error(`❌ Submission failed: ${response.status} - ${response.statusText}`);
            }

            console.log("✅ URL submitted successfully!");

            // After successful submission, close all dialogs.
            onClose();
        } catch (error) {
            console.error("❌ Error submitting URL:", error);
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
                        <h2 className="text-xl font-bold max-w-md break-words">
                            {data.metadata.title}</h2>
                        <p className="text-sm text-gray-600">File Type: {data.metadata.file_type}</p>
                        <p className="text-sm text-gray-600">Size: {data.metadata.size} characters</p>
                        <p className="text-sm text-gray-600">Confidentiality: {data.metadata.confidentiality}</p>

                        <div className="border-t pt-4">
                            <h3 className="font-semibold">Extracted Content</h3>
                            <p className="text-sm text-gray-800 h-32 overflow-auto max-w-md">
                                {data.content || "No content extracted."}
                            </p>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-semibold">Source</h3>
                            <a href={data.source} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                View Page
                            </a>
                        </div>

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
