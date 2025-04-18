import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Pool } from 'pg';

// Load API keys from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const pool = new Pool({
  connectionString: process.env.INTERSIGHTAI_DOC_USE_CASE_DATABASE_URL,
});

if (!OPENAI_API_KEY) {
  throw new Error("❌ Missing OpenAI API key in .env file");
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });



async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    input: text,
    model: 'text-embedding-3-small',
  });
  return response.data[0].embedding;
}

async function searchSimilarQuestions(query: string, limit: number = 5): Promise<any[]> {
  const client = await pool.connect();
  try {
    const embedding = await getEmbedding(query);

    const { rows } = await client.query(
      `
      SELECT id, question, golden_truth,
             1 - (question_embedding <#> $1::vector) AS question_score,
             1 - (golden_truth_embedding <#> $1::vector) AS truth_score
      FROM questions
      ORDER BY LEAST(
        question_embedding <#> $1::vector,
        golden_truth_embedding <#> $1::vector
      ) ASC
      LIMIT $2;
      `,
      [`[${embedding.join(',')}]`, limit]);

    return rows.map((r: { id: any; question: any; golden_truth: any; question_score: number; truth_score: number; }) => ({
      id: r.id,
      question: r.question,
      golden_truth: r.golden_truth,
      score: Math.max(r.question_score, r.truth_score),
    }));
  } catch (err) {
    console.error('❌ Vector search error:', err);
    return [];
  } finally {
    client.release();
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
async function getAiResponse(conversation: any[], searchResults: any, vectorContext: any[], query: string) {
  console.log("🤖 Sending request to OpenAI...");

  const systemMessage = {
    role: "system",
    content: `You are a helpful AI assistant specializing in Cisco Intersight. Your task is to:
- Provide **accurate, structured responses**.
- Format responses using **Markdown** (e.g., **bold**, *italics*, \`code\`, lists, tables).
- Reference **topics related to Cisco Intersight**.
- **Never include profanity or inappropriate content**.
- **Relate everything to Intersight**.

## 🛠 **Response Formatting**
1. Use **Markdown**:
   - **Headings** ('## Features of Cisco Intersight')
   - **Inline Code** (\`kubectl get nodes\`)
   - **Lists** ('- Feature 1').
   - **Tables** (for comparisons).

2. **Stay on topic**:
   - Ignore non-Cisco-related queries.

## 🧠 Similar Questions from Vector Search
${vectorContext.map((item, i) => `### Q${i + 1}: ${item.question}\nGolden Truth: ${item.golden_truth}`).join('\n\n')}

## 🔎 Additional Search Results
- **Google Search Results:** ${JSON.stringify(searchResults.googleResults, null, 2)}
- **Vector Database Results:** ${JSON.stringify(searchResults.vectorResults, null, 2)}

Now provide a well-structured answer to the following query: "${query}"`,
  };

  console.log(systemMessage)
  const messages = [
    systemMessage,
    ...conversation.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: "user", content: query }, // Explicitly append query at the end
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
    const vectorContext = await searchSimilarQuestions(query, 5);
    const searchResults = await fetchSearchResults(
      query,
      resultsLimit,
      limit,
      distance,
      useGoogleSearch,
      useVectorSearch
    );

    console.log("🤖 Calling OpenAI...");
    const aiResponse = await getAiResponse(conversation, searchResults, vectorContext, query);

    console.log("✅ Returning response to client.");
    return NextResponse.json({ searchResults, aiResponse }, { status: 200 });
  } catch (error) {
    console.error("❌ Error in unified search AI:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
