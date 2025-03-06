import { NextRequest, NextResponse } from "next/server";

const DOCUMENT_DB_URL = process.env.INTERSIGHTAI_DB_URL;
const SECURITY_TOKEN = process.env.SECURITY_TOKEN;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SECURITY_TOKEN}`,
};

// 🚀 **GET all documents**
export async function GET() {
  console.log("🔍 Fetching all documents...");

  if (!DOCUMENT_DB_URL || !SECURITY_TOKEN) {
    return NextResponse.json({ error: "Missing database configuration" }, { status: 500 });
  }

  try {
    const response = await fetch(`${DOCUMENT_DB_URL}/documents`, { method: "GET", headers });
    if (!response.ok) throw new Error(`❌ Failed to fetch documents: ${response.statusText}`);

    const documents = await response.json();
    return NextResponse.json(Array.isArray(documents) ? documents : []);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching documents" }, { status: 500 });
  }
}

// 🚀 **POST - Create a new document**
export async function POST(req: NextRequest) {
  console.log("Creating new document...");

  if (!DOCUMENT_DB_URL || !SECURITY_TOKEN) {
    return NextResponse.json({ error: "Missing database configuration" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const response = await fetch(`${DOCUMENT_DB_URL}/documents`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`❌ Failed to create document: ${response.statusText}`);
    return NextResponse.json(await response.json(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error creating document" }, { status: 500 });
  }
}
