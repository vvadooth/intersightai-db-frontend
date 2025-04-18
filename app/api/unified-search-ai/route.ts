import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Load API keys from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";


if (!OPENAI_API_KEY) {
  throw new Error("❌ Missing OpenAI API key in .env file");
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });


async function getWebSearchSummary(query: string, searchResults: any): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-search-preview",
      messages: [
        {
          role: "system",
          content: `
You are a Cisco Intersight specialist.

You have two inputs:
1. A user query
2. A set of reliable Vector Database Results from Cisco Intersight subject matter experts

### Your Instructions:
- First, **try to answer the query using only the Vector Database Results**.
- If you **cannot find a sufficient answer**, then and only then:
  - Use **live web search** to find a highly credible and verifiable answer.
  - **Cite the source** exactly if you use anything from the web.
- If neither vector nor web has a trustworthy answer, reply: "There is no confirmed Cisco documentation matching this question."

Always prioritize vector data. Never make things up.

### Vector Database Results:
${JSON.stringify(searchResults, null, 2)}
          `.trim(),
        },
        {
          role: "user",
          content: query,
        },
      ],
    });

    const response = completion.choices[0]?.message?.content || "No web search summary available.";
    console.log("🌐 Web Search Summary:", response);
    return response;
  } catch (err) {
    console.error("❌ Web Search Summary Error:", err);
    return "Web search failed or returned no content.";
  }
}


async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    input: text,
    model: 'text-embedding-3-small',
  });
  return response.data[0].embedding;
}

// 🚀 **Fetch Search Results from Google & Vector DB**
async function fetchSearchResults(
  query: string,
  googleLimit: number,
  vectorLimit: number,
  distance: number,
  useGoogleSearch: boolean,
  useVectorSearch: boolean
) {
  console.log(`🔍 Fetching search results for query: "${query}"`);

  try {
    const searchPromises: Promise<Response>[] = [];

    if (useGoogleSearch) {
      searchPromises.push(
        fetch(`${BASE_URL}/api/google-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, resultsLimit: googleLimit }),
        })
      );
    }

    if (useVectorSearch) {
      searchPromises.push(
        fetch(`${BASE_URL}/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit: vectorLimit, distance }),
        })
      );
    }

    const searchResponses = await Promise.allSettled(searchPromises);

    let googleResults: any[] = [];
    let vectorResults: any[] = [];

    async function safeParseJson(response: Response, label: string) {
      try {
        const text = await response.text();
        return JSON.parse(text);
      } catch (err) {
        console.warn(`⚠️ Failed to parse JSON from ${label}.`);
        return null;
      }
    }

    if (useGoogleSearch && searchResponses[0].status === 'fulfilled') {
      const jsonData = await safeParseJson(searchResponses[0].value, 'Google Search');
      if (jsonData && jsonData.searchResults) {
        googleResults = jsonData.searchResults;
      }
    }

    if (useVectorSearch) {
      const vectorIndex = useGoogleSearch ? 1 : 0;
      const vectorResp = searchResponses[vectorIndex];
      if (vectorResp.status === 'fulfilled') {
        const vectorData = await safeParseJson(vectorResp.value, 'Vector Search');
        if (Array.isArray(vectorData)) {
          vectorResults = vectorData;
        }
      }
    }



    return { googleResults, vectorResults };
  } catch (error) {
    console.error("❌ Error fetching search results:", error);
    return { googleResults: [], vectorResults: [] };
  }
}



// 🚀 **Call OpenAI Chat Model**
async function getAiResponse(conversation: any[], searchResults: any, webSearchSummary: string, query: string) {
  console.log("🤖 Sending request to OpenAI...");

  const systemMessage = {
    role: "system",
    content: `You are a helpful AI assistant specializing in **Cisco Intersight**. Your role is to provide **factual, structured, and markdown-formatted answers** to user questions using only the information available in the search results below.
  
  ### 🧠 Source Trust Hierarchy — Follow This Order:
  1. **Use the Vector Database Results FIRST** — These are subject matter expert-verified and have the highest reliability. This should be your **primary source** of truth.
  2. **If the Vector Results do not contain enough information**, you may **supplement with Google Search Results**, but still prioritize vector-based answers.
  3. **Only if both the Vector and Google Results fail**, you may refer to the **Web Search Summary** — treat this as **supplementary** and **never build your entire answer based solely on it**.
  
  Do not make anything up. If none of the sources help answer the question, say "I don't know" instead of guessing.
  
  ### 🛠 Markdown Response Format
  - Use **headings** (e.g., \`## Overview of Intersight Policies\`)
  - Use **bold**, *italics*, \`code\`, lists, and tables where appropriate
  - Avoid fluff, and keep responses concise and technical
  
  ### 🔒 Restrictions
  - Do **not** hallucinate or fabricate links or data
  - Do **not** include anything outside the context of Cisco Intersight
  - Do **not** include any profanity or inappropriate content
  
  ---
  
  ### 🔍 Search Result Context
  
  **Vector Database Results** (highest priority):
  ${JSON.stringify(searchResults.vectorResults, null, 2)}
  
  **Google Search Results** (fallback if vector is insufficient):
  ${JSON.stringify(searchResults.googleResults, null, 2)}
  
  **Web Search Summary** (use only if others fail or for context expansion, sometimes this will be wrong, if there is no mention of any of these topics or answers in the vector database results then this is probably incorrect):
  ${webSearchSummary}
  
  ---
  
  Now generate a detailed, markdown-formatted response to the following query:
  
  "${query}"`,
  };
  

  console.log(systemMessage)
  const messages = [
    systemMessage,
    ...conversation.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: "user", content: query }, // Explicitly append query at the end
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    console.log("✅ OpenAI Response:", completion.choices[0]?.message?.content || "No response.");
    return completion.choices[0]?.message?.content || "No response.";
  } catch (error) {
    console.error("❌ OpenAI API Error:", error);
    return "Error processing AI response.";
  }
}

// 🚀 **POST - Unified Search + OpenAI Response**
export async function POST(req: NextRequest) {
  try {
    const {
      query,
      resultsLimit = 10,
      limit = 10,
      distance = 0.4,
      conversation = [],
      useGoogleSearch = false,
      useVectorSearch = true,
    } = await req.json();

    if (!query) {
      console.error("❌ Error: Query is missing.");
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log(`🔎 Received query: "${query}"`);
    console.log(
      `🔢 Parameters - Google Limit: ${resultsLimit}, Vector Limit: ${limit}, Distance: ${distance}`
    );
    console.log(
      `✅ Search Flags - Google: ${useGoogleSearch}, Vector: ${useVectorSearch}`
    );

    console.log("🔎 Fetching search results...");
    const searchResults = await fetchSearchResults(
      query,
      resultsLimit,
      limit,
      distance,
      useGoogleSearch,
      useVectorSearch
    );

    console.log("🤖 Calling OpenAI...");

    const top2VectorResults = {
      vectorResults: searchResults.vectorResults.slice(0, 2),
      googleResults: [], // explicitly exclude Google results
    };

    const webSearchSummary = await getWebSearchSummary(query, top2VectorResults);
    const aiResponse = await getAiResponse(conversation, searchResults, webSearchSummary, query);

    console.log("✅ Returning response to client.");
    return NextResponse.json({ searchResults, aiResponse }, { status: 200 });
  } catch (error) {
    console.error("❌ Error in unified search AI:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

