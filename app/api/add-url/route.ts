import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url, title } = await req.json();

    if (!url || !title) {
      return NextResponse.json({ error: "Missing URL or title" }, { status: 400 });
    }

    console.log("🌐 Sending URL to scraper:", url);

    // Get the scraper URL from environment variable
    const scraperUrl = process.env.SCRAPER_API_URL;
    if (!scraperUrl) {
      throw new Error("SCRAPER_API_URL environment variable is not set");
    }

    // Send the URL to the Railway scraper service
    const response = await fetch(`${scraperUrl}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Scraper failed: ${response.statusText}`);
    }

    const scraperData = await response.json();
    const extractedContent = scraperData.content;

    console.log("✅ Extracted text:", extractedContent.length, "characters");

    // Prepare response data
    const metadata = {
      source: url,
      content: extractedContent,
      metadata: {
        size: extractedContent.length,
        title,
        file_type: "url",
        confidentiality: "public",
      },
    };

    console.log("📤 Sending extracted data...");
    return NextResponse.json(metadata, { status: 200 });
  } catch (error) {
    console.error("❌ URL Processing Error:", error);
    return NextResponse.json({ error: "Failed to process URL" }, { status: 500 });
  }
}
