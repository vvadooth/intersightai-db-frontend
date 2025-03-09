import { NextRequest, NextResponse } from "next/server";

const SEARCH_BACKEND_URL = process.env.INTERSIGHTAI_DB_URL; // Go backend URL
const SECURITY_TOKEN = process.env.SECURITY_TOKEN;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SECURITY_TOKEN}`,
};

// 🚀 **POST - Search API**
export async function POST(req: NextRequest) {
  console.log("🔍 Performing search...");

  if (!SEARCH_BACKEND_URL || !SECURITY_TOKEN) {
    console.error("❌ Missing backend configuration");
    return NextResponse.json({ error: "Missing backend configuration" }, { status: 500 });
  }

  try {
    const { query, limit = 10, distance = 0.4 } = await req.json();
    console.log("🔎 Search Query:", query);

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Call the Go backend to execute search
    const response = await fetch(`${SEARCH_BACKEND_URL}/search?limit=${limit}&distance=${distance}`, {
      method: "GET",
      headers: { ...headers, "X-Search-Query": query },
    });

    if (!response.ok) {
      throw new Error(`❌ Search request failed: ${response.statusText}`);
    }

    const results = await response.json();
    console.log("📡 Search Results:", results);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error("❌ Error searching documents:", error);
    return NextResponse.json({ error: "Error searching documents" }, { status: 500 });
  }
}
