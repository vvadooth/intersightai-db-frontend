import { NextRequest, NextResponse } from "next/server";

// Define the params type as a Promise
type Params = Promise<{ id: string }>;

// Update the GET handler to handle async params
export async function GET(
  req: NextRequest,
  { params }: { params: Params } // Use the Promise-based type
) {
  const { id } = await params; // Await the Promise to get the id
  console.log(`🔍 Fetching document history for ID: ${id}`);

  const DOCUMENT_DB_URL = process.env.INTERSIGHTAI_DB_URL;
  const SECURITY_TOKEN = process.env.SECURITY_TOKEN;

  if (!DOCUMENT_DB_URL || !SECURITY_TOKEN) {
    console.error("❌ Missing database configuration");
    return NextResponse.json(
      { error: "Missing database configuration" },
      { status: 500 }
    );
  }

  try {
    const url = `${DOCUMENT_DB_URL}/documents/${id}/history`;
    console.log(`🌍 Making request to: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SECURITY_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`📡 Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      return NextResponse.json(
        { error: `Failed to fetch chunks: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ Chunks Data:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error fetching chunks:", error);
    return NextResponse.json(
      { error: "Error fetching chunks" },
      { status: 500 }
    );
  }
}