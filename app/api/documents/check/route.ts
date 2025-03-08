import { NextRequest, NextResponse } from "next/server";

const DOCUMENT_DB_URL = process.env.INTERSIGHTAI_DB_URL;
const SECURITY_TOKEN = process.env.SECURITY_TOKEN;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SECURITY_TOKEN}`,
};

// 🚀 **POST - Check if document already exists**
export async function POST(req: NextRequest) {
  console.log("🔍 Checking if document exists...");

  if (!DOCUMENT_DB_URL || !SECURITY_TOKEN) {
    console.error("❌ Missing database configuration");
    return NextResponse.json({ error: "Missing database configuration" }, { status: 500 });
  }

  try {
    const { source } = await req.json();
    console.log("🌍 Checking document source:", source);

    if (!source) {
      return NextResponse.json({ error: "Source URL is required" }, { status: 400 });
    }

    // Call the database to check if the document exists
    const response = await fetch(`${DOCUMENT_DB_URL}/documents/exist?source=${encodeURIComponent(source)}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`❌ Failed to check document existence: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📡 Document Check Response:", data);

    // If document does not exist, allow new ingestion
    if (!data.exists) {
      return NextResponse.json({ exists: false, message: "✅ Document can be ingested." });
    }

    // If document is soft deleted, prompt reactivation
    if (data.document.status === "deleted") {
      return NextResponse.json({
        exists: true,
        reactivation: true,
        message: "⚠️ This document was previously deleted. Do you want to reactivate it?",
      });
    }

    // If document is already active
    return NextResponse.json({
      exists: true,
      reactivation: false,
      message: "ℹ️ This document has already been ingested.",
    });

  } catch (error) {
    console.error("❌ Error checking document existence:", error);
    return NextResponse.json({ error: "Error checking document existence" }, { status: 500 });
  }
}
