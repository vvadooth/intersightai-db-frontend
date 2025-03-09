"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- Common Components for VectorSearch ---
// (Same as in GoogleSearch.tsx)

function TruncatedText({ text, maxLength = 50 }: { text: string; maxLength?: number }) {
  if (!text) return <span />;
  const truncated = text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  return text.length > maxLength ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{truncated}</span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  ) : (
    <span>{truncated}</span>
  );
}

function PrettyJSON({ data }: { data: any }) {
  if (data === null || data === undefined) return <div>{""}</div>;
  if (typeof data !== "object") {
    return <div>{data.toString()}</div>;
  }
  return (
    <div className="text-left">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="mb-2">
          <span className="font-bold">{key}:</span>{" "}
          <span>
            {typeof value === "object" ? (
              <PrettyJSON data={value} />
            ) : (
              key === "chunk" || key === "snippet" ? value?.toString() ?? "" : <TruncatedText text={value?.toString() ?? ""} maxLength={50} />
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function JsonAccordion({ data }: { data: any[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {data.map((item, index) => {
        let label = "";
        if (item.distance !== undefined || item.title !== undefined) {
          const distanceText = item.distance !== undefined ? item.distance?.toString() : "";
          const truncatedTitle = item.title ? (item.title.length > 50 ? item.title.slice(0, 50) + "..." : item.title) : "";
          label = `distance: ${distanceText}`;
          if (item.title) {
            label += ` | title: ${truncatedTitle}`;
          }
          if (item.source) {
            label += ` (source: ${item.source.length > 50 ? item.source.slice(0, 50) + "..." : item.source})`;
          }
        } else {
          const itemId = item.id ?? index;
          label = `ID: ${itemId}`;
        }
        return (
          <AccordionItem key={item.id ?? index} value={`${item.id ?? index}`}>
            <AccordionTrigger>
              <span>{label}</span>
            </AccordionTrigger>
            <AccordionContent>
              <PrettyJSON data={item} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function renderResponse(response: any) {
  if (!response) return null;
  if (Array.isArray(response)) {
    return <JsonAccordion data={response} />;
  }
  if (typeof response === "object") {
    return <PrettyJSON data={response} />;
  }
  if (typeof response === "string") {
    return (
      <div className="prose break-words text-left">
        <ReactMarkdown>{response}</ReactMarkdown>
      </div>
    );
  }
  return null;
}

// -------------------- VectorSearch Component --------------------

export default function VectorSearch() {
  const [vectorQuery, setVectorQuery] = useState("What are the different licensing tiers in intersight?");
  const [vectorLimit, setVectorLimit] = useState(5);
  const [vectorDistance, setVectorDistance] = useState(1.5);
  const [vectorResult, setVectorResult] = useState<any>(null);
  const [vectorLoading, setVectorLoading] = useState(false);

  const handleVectorSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setVectorLoading(true);
    setVectorResult(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vectorQuery, limit: vectorLimit, distance: vectorDistance }),
      });
      const data = await res.json();
      setVectorResult(data);
    } catch (error) {
      setVectorResult({ error: "Error calling API" });
    }
    setVectorLoading(false);
  };

  return (
    <TabsContent value="vector" className="mt-4">
      <p className="mb-2 text-sm text-muted-foreground">
        This endpoint calls <code>/api/search</code> with the provided query, limit, and distance.
      </p>
      <form onSubmit={handleVectorSearch} className="space-y-4">
        <div>
          <Label htmlFor="vectorQuery">Query</Label>
          <Input
            id="vectorQuery"
            value={vectorQuery}
            onChange={(e) => setVectorQuery(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="vectorLimit">Limit</Label>
          <Input
            id="vectorLimit"
            type="number"
            value={vectorLimit}
            onChange={(e) => setVectorLimit(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="vectorDistance">Distance</Label>
          <Input
            id="vectorDistance"
            type="number"
            step="0.1"
            value={vectorDistance}
            onChange={(e) => setVectorDistance(Number(e.target.value))}
          />
        </div>
        <Button type="submit" disabled={vectorLoading}>
          {vectorLoading ? "Loading..." : "Test Vector Search"}
        </Button>
      </form>
      {vectorResult && (
        <div className="mt-4 max-w-full text-left max-h-96 overflow-y-auto whitespace-pre-wrap break-words p-4">
          {renderResponse(vectorResult)}
        </div>
      )}
    </TabsContent>
  );
}
