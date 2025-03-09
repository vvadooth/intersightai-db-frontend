import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
  throw new Error("❌ Missing environment variables for Google Search API");
}

// Define an interface for search results
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayLink: string;
  sourceType: string;
}

// Fetch Google search results
async function fetchGoogleSearchResults(query: string, resultLimit: number): Promise<SearchResult[]> {
  try {
    console.log("🔍 Performing Google Search for query:", query);

    const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      query
    )}&key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}`;

    const response = await fetch(googleSearchUrl);
    if (!response.ok) {
      throw new Error(`❌ Google Search API failed: ${response.statusText}`);
    }

    const searchResults = (await response.json()).items || [];

    // Limit the number of search results and return structured data
    return searchResults.slice(0, resultLimit).map((result: any) => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet,
      displayLink: result.displayLink,
      sourceType: "Google Search",
    }));
  } catch (error) {
    console.error("❌ Error fetching Google search results:", error);
    return [];
  }
}

// 🚀 **POST - Google Search API (No Scraping)**
export async function POST(req: NextRequest) {
  try {
    const { query, resultsLimit = 10 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("🔎 Fetching Google Search results...");
    const searchResults: SearchResult[] = await fetchGoogleSearchResults(query, resultsLimit);

    if (searchResults.length === 0) {
      return NextResponse.json({ error: "No search results found" }, { status: 404 });
    }

    console.log(`✅ Retrieved ${searchResults.length} results.`);
    return NextResponse.json({ searchResults }, { status: 200 });

  } catch (error) {
    console.error("❌ Error processing Google Search request:", error);
    return NextResponse.json({ error: "Failed to process search request" }, { status: 500 });
  }
}
