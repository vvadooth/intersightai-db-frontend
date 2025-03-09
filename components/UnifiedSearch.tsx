"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { User, Bot } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define the conversation Message type.
interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * processToken:
 * Splits a token and returns a span. If the token is a long URL, it will be truncated and wrapped in a tooltip.
 * The unique key is built using the token's index.
 */
function processToken(token: string, idx: number) {
  const urlRegex = /https?:\/\/\S+/;
  if (urlRegex.test(token) && token.length > 50) {
    return (
      <Tooltip key={`tooltip-${idx}`}>
        <TooltipTrigger asChild>
          <span>{token.slice(0, 50)}...</span>
        </TooltipTrigger>
        <TooltipContent>{token}</TooltipContent>
      </Tooltip>
    );
  }
  return <span key={`token-${idx}`}>{token} </span>;
}

/**
 * RawJson:
 * Renders raw JSON using JSON.stringify and breaks the text into lines and tokens.
 * Each token is processed via processToken to add truncation and tooltips.
 */
function RawJson({ data }: { data: any }) {
  const jsonStr = JSON.stringify(data, null, 2);
  const lines = jsonStr.split("\n");
  return (
    <div className="whitespace-pre-wrap break-words p-4 border rounded text-left font-mono">
      {lines.map((line, lineIndex) => (
        <div key={`line-${lineIndex}`}>
          {line.split(" ").map((token, tokenIndex) => processToken(token, tokenIndex))}
        </div>
      ))}
    </div>
  );
}

export default function UnifiedSearch() {
  const [unifiedQuery, setUnifiedQuery] = useState("What are the different licensing tiers in intersight?");
  const [unifiedResultsLimit, setUnifiedResultsLimit] = useState(5);
  const [unifiedLimit, setUnifiedLimit] = useState(5);
  const [unifiedDistance, setUnifiedDistance] = useState(0.4);
  const [useGoogleSearch, setUseGoogleSearch] = useState(true);
  const [useVectorSearch, setUseVectorSearch] = useState(true);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [unifiedResult, setUnifiedResult] = useState<any>(null);
  const [unifiedLoading, setUnifiedLoading] = useState(false);

  const handleUnifiedSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnifiedLoading(true);
    setUnifiedResult(null);
    const userMessage: Message = { role: "user", content: unifiedQuery };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);

    try {
      const res = await fetch("/api/unified-search-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: unifiedQuery,
          resultsLimit: unifiedResultsLimit,
          limit: unifiedLimit,
          distance: unifiedDistance,
          useGoogleSearch,
          useVectorSearch,
          conversation: updatedConversation,
        }),
      });
      const data = await res.json();
      setUnifiedResult(data);
      const assistantMessage: Message = {
        role: "assistant",
        content: data.aiResponse || "No response.",
      };
      setConversation((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setUnifiedResult({ error: "Error calling API" });
    }
    setUnifiedLoading(false);
    setUnifiedQuery("");
  };

  return (
    <TabsContent value="unified" className="mt-4">
      <p className="mb-2 text-sm text-muted-foreground">
        This endpoint calls <code>/api/unified-search-ai</code> with multiple parameters.
        Your query is appended to an internal conversation.
      </p>
      <form onSubmit={handleUnifiedSearch} className="space-y-4">
        <div>
          <Label htmlFor="unifiedQuery">Query</Label>
          <Input
            id="unifiedQuery"
            value={unifiedQuery}
            onChange={(e) => setUnifiedQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="unifiedResultsLimit">Google Results Limit</Label>
            <Input
              id="unifiedResultsLimit"
              type="number"
              value={unifiedResultsLimit}
              onChange={(e) => setUnifiedResultsLimit(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="unifiedLimit">Vector Limit</Label>
            <Input
              id="unifiedLimit"
              type="number"
              value={unifiedLimit}
              onChange={(e) => setUnifiedLimit(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="unifiedDistance">Distance</Label>
            <Input
              id="unifiedDistance"
              type="number"
              step="0.1"
              value={unifiedDistance}
              onChange={(e) => setUnifiedDistance(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="useGoogleSearch"
            checked={useGoogleSearch}
            onCheckedChange={(checked) => setUseGoogleSearch(!!checked)}
          />
          <Label htmlFor="useGoogleSearch">Use Google Search</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="useVectorSearch"
            checked={useVectorSearch}
            onCheckedChange={(checked) => setUseVectorSearch(!!checked)}
          />
          <Label htmlFor="useVectorSearch">Use Vector Search</Label>
        </div>
        <Button type="submit" disabled={unifiedLoading}>
          {unifiedLoading ? "Loading..." : "Test Unified Search"}
        </Button>
      </form>
      {conversation.length > 0 && (
        <div className="mt-4 max-w-full text-left overflow-auto p-4 border rounded space-y-4 max-h-96">
        {conversation.map((msg, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              {msg.role === "user" ? (
                <User className="h-6 w-6 text-blue-500 flex-shrink-0" />
              ) : (
                <Bot className="h-6 w-6 text-green-500 flex-shrink-0" />
              )}
              <div className="prose">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
      {unifiedResult && (
        <div className="mt-4 max-w-full text-left overflow-y-auto whitespace-pre-wrap break-words p-4 border rounded max-h-96">
        <RawJson data={unifiedResult} />
        </div>
      )}
    </TabsContent>
  );
}
