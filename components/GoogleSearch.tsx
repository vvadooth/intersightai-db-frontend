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

// --- Common Components for GoogleSearch ---
// TruncatedText: shows truncated text with a tooltip displaying the full string.
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

// PrettyJSON: Recursively formats JSON data in a neat, left-aligned layout.
// For "chunk" or "snippet" keys, the full text is shown.
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
              key === "chunk" || key === "snippet"
                ? value?.toString() ?? ""
                : <TruncatedText text={value?.toString() ?? ""} maxLength={50} />
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// JsonAccordion: Splits an array of JSON objects into separate accordion items.
function JsonAccordion({ data }: { data: any[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {data.map((item, index) => {
        let label = "";
        if (item.distance !== undefined || item.title !== undefined) {
          const truncatedTitle = item.title
            ? item.title.length > 50
              ? item.title.slice(0, 50) + "..."
              : item.title
            : "";
          if (item.title) {
            label += `${truncatedTitle}`;
          }
          if (item.source) {
            label += ` (source: ${
              item.source.length > 50 ? item.source.slice(0, 50) + "..." : item.source
            })`;
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

// renderResponse: Decides how to render an API response.
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

// -------------------- GoogleSearch Component --------------------

export default function GoogleSearch() {
  const [googleQuery, setGoogleQuery] = useState("What are the different licensing tiers in intersight?");
  const [googleResultsLimit, setGoogleResultsLimit] = useState(5);
  const [googleResult, setGoogleResult] = useState<any>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleLoading(true);
    setGoogleResult(null);
    try {
      const res = await fetch("/api/google-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: googleQuery, resultsLimit: googleResultsLimit }),
      });
      const data = await res.json();
      setGoogleResult(data);
    } catch (error) {
      setGoogleResult({ error: "Error calling API" });
    }
    setGoogleLoading(false);
  };

  return (
    <TabsContent value="google" className="mt-4">
      <p className="mb-2 text-sm text-muted-foreground">
        This endpoint calls <code>/api/google-search</code> using the provided query and results limit.
      </p>
      <form onSubmit={handleGoogleSearch} className="space-y-4">
        <div>
          <Label htmlFor="googleQuery">Query</Label>
          <Input
            id="googleQuery"
            value={googleQuery}
            onChange={(e) => setGoogleQuery(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="googleResultsLimit">Results Limit</Label>
          <Input
            id="googleResultsLimit"
            type="number"
            value={googleResultsLimit}
            onChange={(e) => setGoogleResultsLimit(Number(e.target.value))}
          />
        </div>
        <Button type="submit" disabled={googleLoading}>
          {googleLoading ? "Loading..." : "Test Google Search"}
        </Button>
      </form>
      {googleResult && (
        <div className="mt-4 max-w-full text-left max-h-96 overflow-y-auto whitespace-pre-wrap break-words p-4">
          {googleResult.searchResults
            ? renderResponse(googleResult.searchResults)
            : renderResponse(googleResult)}
        </div>
      )}
    </TabsContent>
  );
}
