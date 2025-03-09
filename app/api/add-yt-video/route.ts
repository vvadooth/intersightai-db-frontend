import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { video_url } = await req.json();

    if (!video_url) {
      return NextResponse.json({ error: "Missing YouTube video URL" }, { status: 400 });
    }

    console.log("🎥 Sending request to FastAPI transcript API:", video_url);

    // Get the FastAPI transcript service URL from environment variables
    const transcriptApiUrl = process.env.SCRAPER_API_URL;
    if (!transcriptApiUrl) {
      throw new Error("TRANSCRIPT_API_URL environment variable is not set");
    }

    // Call the FastAPI transcript endpoint
    const response = await fetch(`${transcriptApiUrl}/get-transcript`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ video_url }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI transcript service failed: ${response.statusText}`);
    }

    const transcriptData = await response.json();
    const { title, transcript } = transcriptData;

    console.log("✅ Transcript received:", transcript.length, "characters");

    // Prepare response data
    const metadata = {
      source: video_url,
      content: transcript,
      metadata: {
        size: transcript.length,
        title,
        file_type: "video",
        confidentiality: "public",
      },
    };

    console.log("📤 Sending extracted transcript...");
    return NextResponse.json(metadata, { status: 200 });

  } catch (error) {
    console.error("❌ YouTube Transcript Processing Error:", error);
    return NextResponse.json({ error: "Failed to process YouTube video" }, { status: 500 });
  }
}
