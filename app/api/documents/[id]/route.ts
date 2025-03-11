import { NextRequest, NextResponse } from "next/server";

const DOCUMENT_DB_URL = process.env.INTERSIGHTAI_DB_URL;
const SECURITY_TOKEN = process.env.SECURITY_TOKEN;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SECURITY_TOKEN}`,
};

// Define the params type as a Promise
type Params = Promise<{ id: string }>;

// 🚀 **GET a single document by ID**
export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params; // Await the Promise to get the id
  console.log(`🔍 Fetching document with ID: ${id}`);

  if (!DOCUMENT_DB_URL || !SECURITY_TOKEN) {
    return NextResponse.json({ error: "Missing database configuration" }, { status: 500 });
  }

  try {
    const response = await fetch(`${DOCUMENT_DB_URL}/documents/${id}`, { method: "GET", headers });
    if (!response.ok) throw new Error(`❌ Failed to fetch document: ${response.statusText}`);

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: "Error fetching document" }, { status: 500 });
  }
}

// 🚀 **PUT - Update a document by ID**
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params; // Await the Promise to get the id
  console.log(`📝 Updating document with ID: ${id}`);

  if (!DOCUMENT_DB_URL || !SECURITY_TOKEN) {
    return NextResponse.json({ error: "Missing database configuration" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const response = await fetch(`${DOCUMENT_DB_URL}/documents/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`❌ Failed to update document: ${response.statusText}`);
    return NextResponse.json({ message: "Document updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Error updating document" }, { status: 500 });
  }
}

// 🚀 **DELETE - Remove a document by ID**
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params; // Await the Promise to get the id
  console.log(`🗑️ Deleting document with ID: ${id}`);

  if (!DOCUMENT_DB_URL || !SECURITY_TOKEN) {
    return NextResponse.json({ error: "Missing database configuration" }, { status: 500 });
  }

  try {
    const response = await fetch(`${DOCUMENT_DB_URL}/documents/${id}`, { method: "DELETE", headers });

    if (!response.ok) throw new Error(`❌ Failed to delete document: ${response.statusText}`);
    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Error deleting document" }, { status: 500 });
  }
}
