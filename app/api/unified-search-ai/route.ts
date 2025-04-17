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


async function safeParseJson(response: { text: () => any; }) {
  try {
    const text = await response.text();
    return JSON.parse(text);
  } catch (err) {
    console.warn("⚠️ Invalid JSON from search API");
    return null;
  }
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

    if (useGoogleSearch && searchResponses[0].status === 'fulfilled') {
      try {
        const jsonData = await searchResponses[0].value.json();
        googleResults = jsonData?.searchResults || [];
      } catch (err) {
        console.warn('⚠️ Google Search returned invalid JSON.');
      }
    }
    
    if (useVectorSearch) {
      const vectorIndex = useGoogleSearch ? 1 : 0;
      const vectorResp = searchResponses[vectorIndex];
      if (vectorResp.status === 'fulfilled') {
        try {
          vectorResults = await vectorResp.value.json();
        } catch (err) {
          console.warn('⚠️ Vector Search returned invalid JSON.');
        }
      }
    }

    console.log(`✅ Google Results (${googleResults.length})`);
    console.log(`✅ Vector Results (${vectorResults?.length ?? 0})`);

    return { googleResults, vectorResults };
  } catch (error) {
    console.error("❌ Error fetching search results:", error);
    return { googleResults: [], vectorResults: [] };
  }
}

// 🚀 **Call OpenAI Chat Model**
async function getAiResponse(conversation: any[], searchResults: any) {
  console.log("🤖 Sending request to OpenAI...");

  const systemMessage = {
    role: "system",
    content: `You are an AI assistant specializing in Cisco Intersight. Your task is to:
- Provide **accurate, structured responses**.
- Format responses using **Markdown** (e.g., **bold**, *italics*, \`code\`, lists, tables).
- Reference **only topics related to Cisco Intersight**.
- **Never include profanity, inappropriate, or off-topic content**.

## 🛠 **Response Formatting**
1. Use **Markdown**:
   - **Headings** ('## Features of Cisco Intersight')
   - **Inline Code** (\`kubectl get nodes\`)
   - **Lists** ('- Feature 1').
   - **Tables** (for comparisons).

2. **Stay on topic**:
   - Ignore non-Cisco-related queries.
   - If a query is off-topic, respond:  
     *"I can only assist with Cisco Intersight topics."*

### 🔎 **Search Results**
- **Google Search Results:** ${JSON.stringify(searchResults.googleResults, null, 2)}
- **Vector Database Results:** ${JSON.stringify(searchResults.vectorResults, null, 2)}

Now provide a well-structured answer.`,
  };

  const messages = [
    systemMessage,
    ...conversation.map((msg) => ({ role: msg.role, content: msg.content })),
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    console.log(
      "✅ OpenAI Response:",
      completion.choices[0]?.message?.content || "No response."
    );
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
    const aiResponse = await getAiResponse(conversation, searchResults);

    console.log("✅ Returning response to client.");
    return NextResponse.json({ searchResults, aiResponse }, { status: 200 });
  } catch (error) {
    console.error("❌ Error in unified search AI:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
