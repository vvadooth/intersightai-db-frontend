"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoogleSearch from "./GoogleSearch";
import VectorSearch from "./VectorSearch";
import UnifiedSearch from "./UnifiedSearch";

export default function PlaygroundModal() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button className="fixed bottom-4 left-4 z-50" onClick={() => setOpen(true)}>
                Playground
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-[95%] min-w-[95%] p-6 overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>API Playground</DialogTitle>
                        <DialogDescription>
                            Use this playground to test each API endpoint individually or the unified API.
                            Adjust parameters as needed.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="unified" className="mt-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="unified">Unified Search</TabsTrigger>
                            <TabsTrigger value="vector">Vector Search</TabsTrigger>
                            <TabsTrigger value="google">Google Search</TabsTrigger>
                        </TabsList>
                        <GoogleSearch />
                        <VectorSearch />
                        <UnifiedSearch />
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    );
}
